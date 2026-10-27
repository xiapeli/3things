import { EMPTY_DATA, parseAppData } from "./data";
import type { AppData, CollectionEntity, CollectionName, Profile } from "./types";

const STORAGE_KEY = "3things:data:v1";

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseAppData(JSON.parse(raw)) : { ...EMPTY_DATA };
  } catch {
    return { ...EMPTY_DATA };
  }
}

let data: AppData = load();
const listeners = new Set<() => void>();

function commit(next: AppData) {
  data = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage cheio ou indisponível: o estado em memória continua funcionando.
  }
  listeners.forEach((listener) => listener());
}

function now() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const store = {
  get: () => data,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  list<K extends CollectionName>(collection: K): CollectionEntity[K][] {
    return data[collection] as CollectionEntity[K][];
  },
  create<K extends CollectionName>(
    collection: K,
    item: Omit<CollectionEntity[K], "id" | "created_date" | "updated_date">,
  ): CollectionEntity[K] {
    const entity = {
      ...item,
      id: makeId(collection),
      created_date: now(),
      updated_date: now(),
    } as CollectionEntity[K];
    commit({ ...data, [collection]: [...data[collection], entity] });
    return entity;
  },
  update<K extends CollectionName>(
    collection: K,
    id: string,
    patch: Partial<CollectionEntity[K]>,
  ): void {
    commit({
      ...data,
      [collection]: (data[collection] as CollectionEntity[K][]).map((item) =>
        item.id === id ? { ...item, ...patch, id, updated_date: now() } : item,
      ),
    });
  },
  remove(collection: CollectionName, id: string): void {
    commit({
      ...data,
      [collection]: (data[collection] as { id: string }[]).filter(
        (item) => item.id !== id,
      ),
    });
  },
  setProfile(profile: Profile): void {
    commit({ ...data, profile });
  },
  exportJson(): string {
    return JSON.stringify({ version: 1, exported_at: now(), ...data }, null, 2);
  },
  importJson(json: string): void {
    commit(parseAppData(JSON.parse(json)));
  },
  replaceData(next: AppData): void {
    commit(parseAppData(next));
  },
  clearHistory(): void {
    commit({ ...data, priorities: [] });
  },
};

export function downloadFile(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
