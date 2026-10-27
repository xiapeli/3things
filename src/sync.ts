import { EMPTY_DATA, hasContent, mergeAppData, parseAppData } from "./data";
import { store } from "./store";
import type { AppData } from "./types";

const API_BASE = import.meta.env.VITE_HOOKS_API_URL || "https://hooks.cool";
const LOCAL_TOKEN_KEY = "3things:session:v1";
const AUTH_STATE_KEY = "3things:auth-state:v1";
const RECOVERY_KEY = "3things:recovery:v1";
const SYNC_META_KEY = "3things:sync-meta:v1";

export interface SessionUser {
  email: string;
  name: string;
  picture?: string;
  provider: "google" | "email";
}

export type SyncStatus =
  | "signed_out"
  | "loading"
  | "ready"
  | "syncing"
  | "offline"
  | "error"
  | "choice"
  | "conflict";

interface SyncState {
  status: SyncStatus;
  user: SessionUser | null;
  lastSyncedAt: string | null;
  error: string | null;
  remote: AppData | null;
}

let state: SyncState = {
  status: "loading",
  user: null,
  lastSyncedAt: null,
  error: null,
  remote: null,
};
const listeners = new Set<() => void>();
let revision: number | null = null;
let initialized = false;
let applyingRemote = false;
let changeVersion = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let syncPromise: Promise<void> | null = null;
let syncMeta = loadSyncMeta();

function loadSyncMeta(): { account: string | null; dirty: boolean } {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SYNC_META_KEY) || "null");
    return { account: typeof parsed?.account === "string" ? parsed.account : null, dirty: parsed?.dirty === true };
  } catch {
    return { account: null, dirty: false };
  }
}

function saveSyncMeta(account: string | null, dirty: boolean) {
  syncMeta = { account, dirty };
  try {
    window.localStorage.setItem(SYNC_META_KEY, JSON.stringify(syncMeta));
  } catch {
    // O estado em memória mantém a proteção durante esta sessão.
  }
}

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function isNative() {
  return "__TAURI_INTERNALS__" in window;
}

function isHosted() {
  return window.location.origin === "https://hooks.cool";
}

function localToken() {
  return window.sessionStorage.getItem(LOCAL_TOKEN_KEY);
}

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(command, args);
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = !isHosted() ? localToken() : null;
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: isHosted() ? "include" : "omit",
  });
  if (response.status === 401) throw new Error("not_authenticated");
  if (response.status === 409) throw new Error("revision_conflict");
  if (!response.ok) throw new Error("server_unavailable");
  return response.json() as Promise<T>;
}

async function exchange(code: string): Promise<SessionUser> {
  if (isNative()) {
    const result = await invoke<{ user: SessionUser }>("native_exchange_code", { code });
    return result.user;
  }
  const result = await api<{ token: string; user: SessionUser }>("/api/auth/app/exchange", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
  window.sessionStorage.setItem(LOCAL_TOKEN_KEY, result.token);
  return result.user;
}

async function currentSession(): Promise<SessionUser | null> {
  if (isNative()) {
    const result = await invoke<{ user: SessionUser }>("native_session");
    return result.user;
  }
  if (isHosted()) {
    const result = await api<{ authenticated: boolean; user?: SessionUser }>("/api/auth/session");
    return result.authenticated ? result.user ?? null : null;
  }
  if (!localToken()) return null;
  const result = await api<{ user: SessionUser }>("/api/auth/app/session");
  return result.user;
}

async function remoteGet(): Promise<{ data: AppData | null; revision: number }> {
  const result = isNative()
    ? await invoke<{ data: unknown; revision: number }>("native_sync_get")
    : await api<{ data: unknown; revision: number }>("/api/3things/sync");
  return { data: result.data === null ? null : parseAppData(result.data), revision: result.revision };
}

async function remotePut(data: AppData, expected: number | null): Promise<number> {
  const result = isNative()
    ? await invoke<{ revision: number }>("native_sync_put", { data, revision: expected })
    : await api<{ revision: number }>("/api/3things/sync", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data, revision: expected }),
      });
  return result.revision;
}

function preserveRecovery() {
  try {
    window.localStorage.setItem(RECOVERY_KEY, store.exportJson());
  } catch {
    // O snapshot local original continua intacto até uma escolha explícita.
  }
}

function authenticated(user: SessionUser) {
  setState({ user, status: "syncing", error: null });
  void pullAfterLogin(user);
}

async function pullAfterLogin(user: SessionUser) {
  try {
    const remote = await remoteGet();
    const local = store.get();
    const cloudData = remote.data ?? EMPTY_DATA;
    revision = remote.revision;
    if (JSON.stringify(local) === JSON.stringify(cloudData)) {
      saveSyncMeta(user.email, false);
      setState({ user, status: "ready", lastSyncedAt: new Date().toISOString(), remote: null });
      return;
    }
    const hasLocal = hasContent(local);
    const hasRemote = hasContent(cloudData);
    const firstSync = syncMeta.account === null;
    const differentAccount = syncMeta.account !== null && syncMeta.account !== user.email;
    const dirtySameAccount = syncMeta.account === user.email && syncMeta.dirty;
    if (firstSync && hasLocal && !hasRemote) {
      revision = await remotePut(local, revision);
      saveSyncMeta(user.email, false);
      setState({ user, status: "ready", lastSyncedAt: new Date().toISOString(), remote: null });
    } else if (dirtySameAccount || (differentAccount && hasLocal) || (firstSync && hasLocal && hasRemote)) {
      preserveRecovery();
      setState({ user, status: "choice", remote: cloudData, error: null });
    } else {
      applyingRemote = true;
      store.replaceData(cloudData);
      applyingRemote = false;
      saveSyncMeta(user.email, false);
      setState({ user, status: "ready", lastSyncedAt: new Date().toISOString(), remote: null });
    }
  } catch (error) {
    handleError(error, user);
  }
}

function handleError(error: unknown, user = state.user) {
  const code = typeof error === "string" ? error : error instanceof Error ? error.message : "network_error";
  if (code === "not_authenticated") {
    revision = null;
    setState({ status: "signed_out", user: null, remote: null, error: user ? "Sua sessão expirou. Entre novamente para sincronizar." : null });
    return;
  }
  if (code === "revision_conflict") {
    preserveRecovery();
    setState({ status: "conflict", error: "Outra versão foi salva na nuvem. Escolha como continuar." });
    void loadConflict();
    return;
  }
  const offline = !navigator.onLine || code === "network_error" || code === "Failed to fetch";
  setState({
    user,
    status: offline ? "offline" : "error",
    error: offline ? "Sem conexão. As alterações continuam salvas neste dispositivo." : "Não foi possível sincronizar agora. Seus dados locais estão preservados.",
  });
}

async function loadConflict() {
  try {
    const remote = await remoteGet();
    revision = remote.revision;
    setState({ remote: remote.data });
  } catch {
    // A cópia local e a escolha manual permanecem disponíveis.
  }
}

async function push(user: SessionUser) {
  if (syncPromise) return syncPromise;
  const version = changeVersion;
  const snapshot = store.get();
  setState({ status: "syncing", error: null });
  syncPromise = (async () => {
    try {
      revision = await remotePut(snapshot, revision);
      saveSyncMeta(user.email, version !== changeVersion);
      setState({ user, status: "ready", lastSyncedAt: new Date().toISOString(), error: null });
    } catch (error) {
      handleError(error, user);
    } finally {
      syncPromise = null;
      if (version !== changeVersion) schedulePush();
    }
  })();
  return syncPromise;
}

function schedulePush() {
  if (!state.user || applyingRemote || ["choice", "conflict", "signed_out", "loading"].includes(state.status)) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void push(state.user!), 700);
}

async function completeCode(code: string, returnedState: string | null) {
  const expectedState = window.localStorage.getItem(AUTH_STATE_KEY);
  if (!expectedState || returnedState !== expectedState) {
    setState({ status: "signed_out", user: null, error: "Não foi possível validar este retorno de login. Inicie novamente pelo app." });
    return;
  }
  window.localStorage.removeItem(AUTH_STATE_KEY);
  setState({ status: "loading", error: null });
  try {
    authenticated(await exchange(code));
  } catch (error) {
    handleError(error, null);
  }
}

function codeFromUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.hostname !== "auth" && url.pathname !== "/auth") return null;
    return { code: url.searchParams.get("code"), state: url.searchParams.get("state") };
  } catch {
    return null;
  }
}

function newClientState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const sync = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  initialize() {
    if (initialized) return;
    initialized = true;
    store.subscribe(() => {
      if (!applyingRemote) {
        changeVersion += 1;
        saveSyncMeta(syncMeta.account, true);
        schedulePush();
      }
    });
    window.addEventListener("online", () => {
      if (state.user && !["choice", "conflict"].includes(state.status)) void push(state.user);
    });
    if (window.location.hash.startsWith("#auth?")) {
      const params = new URLSearchParams(window.location.hash.slice(6));
      const code = params.get("code");
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/profile`);
      if (code) void completeCode(code, params.get("state"));
    } else {
      void currentSession().then((user) => {
        if (user) authenticated(user);
        else setState({ status: "signed_out", user: null });
      }).catch((error) => handleError(error, null));
    }
    if (isNative()) {
      void import("@tauri-apps/plugin-deep-link").then(({ onOpenUrl, getCurrent }) => {
        void onOpenUrl((urls) => {
          for (const url of urls) {
            const auth = codeFromUrl(url);
            if (auth?.code) void completeCode(auth.code, auth.state);
          }
        });
        void getCurrent().then((urls) => {
          for (const url of urls ?? []) {
            const auth = codeFromUrl(url);
            if (auth?.code) void completeCode(auth.code, auth.state);
          }
        });
      });
    }
  },
  async login(provider: "google" | "email") {
    try {
      const client = isNative() ? "desktop" : isHosted() ? "web" : "local";
      const clientState = newClientState();
      window.localStorage.setItem(AUTH_STATE_KEY, clientState);
      const returnTo = client === "web" ? "&returnTo=%2F3things%2Fapp%2F" : "";
      const url = provider === "google"
        ? `${API_BASE}/api/auth/google?product=3things&client=${client}&clientState=${encodeURIComponent(clientState)}${returnTo}`
        : `${API_BASE}/login/?product=3things&client=${client}&clientState=${encodeURIComponent(clientState)}${returnTo}`;
      if (isNative()) {
        await invoke("native_open_auth", { url });
      } else {
        window.location.assign(url);
      }
    } catch {
      setState({ status: "error", error: "Não foi possível abrir o acesso no navegador. Tente novamente." });
    }
  },
  syncNow() {
    if (state.user && !["choice", "conflict"].includes(state.status)) void push(state.user);
  },
  async resolveConflict(strategy: "local" | "remote" | "merge") {
    if (!state.user || !state.remote) return;
    const local = store.get();
    const remote = state.remote;
    preserveRecovery();
    const next = strategy === "local" ? local : strategy === "remote" ? remote : mergeAppData(local, remote);
    applyingRemote = true;
    store.replaceData(next);
    applyingRemote = false;
    setState({ status: "syncing", remote: null });
    const version = changeVersion;
    try {
      revision = await remotePut(next, revision);
      saveSyncMeta(state.user!.email, version !== changeVersion);
      setState({ status: "ready", lastSyncedAt: new Date().toISOString(), error: null });
      if (version !== changeVersion) schedulePush();
    } catch (error) {
      handleError(error);
    }
  },
  async logout() {
    if (timer) clearTimeout(timer);
    const user = state.user;
    try {
      if (isNative()) await invoke("native_logout");
      else if (isHosted()) await api("/api/auth/logout", { method: "POST" });
      else if (localToken()) await api("/api/auth/app/logout", { method: "POST" });
    } catch {
      // A sessão local é removida mesmo offline; o token expira no servidor.
    }
    window.sessionStorage.removeItem(LOCAL_TOKEN_KEY);
    revision = null;
    setState({ status: "signed_out", user: null, remote: null, error: null, lastSyncedAt: null });
    if (user) changeVersion += 1;
  },
};
