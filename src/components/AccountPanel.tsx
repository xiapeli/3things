import { Cloud, CloudOff, LogOut, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useSync } from "../hooks";
import { sync } from "../sync";

const STATUS_LABELS = {
  loading: "VERIFICANDO CONTA…",
  ready: "SALVO NA NUVEM",
  syncing: "SINCRONIZANDO…",
  offline: "OFFLINE — SALVO NESTE DISPOSITIVO",
  error: "SINCRONIZAÇÃO PENDENTE",
  choice: "ESCOLHA COMO COMEÇAR",
  conflict: "REVISÃO NECESSÁRIA",
  signed_out: "SOMENTE NESTE DISPOSITIVO",
};

export function SyncBadge() {
  const { status, user } = useSync();
  const offline = status === "offline" || status === "error" || status === "signed_out";
  const Icon = offline ? CloudOff : Cloud;
  return (
    <div className="flex items-center gap-2 text-[10px] font-black text-gray-600" title={user?.email}>
      <Icon className="w-4 h-4" />
      <span>{STATUS_LABELS[status]}</span>
    </div>
  );
}

export function AccountPanel() {
  const account = useSync();
  const loggedIn = !!account.user;

  return (
    <>
      <div className="bg-white neo-brutal-border neo-brutal-shadow">
        <div className="bg-blue-500 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            {loggedIn ? <Cloud className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            CONTA E SINCRONIZAÇÃO
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {!loggedIn && account.status !== "loading" ? (
            <>
              <div>
                <h3 className="text-2xl font-black mb-2">SEUS 3THINGS, EM TODO MAC.</h3>
                <p className="text-gray-600 font-medium">
                  Entre com sua conta hooks.cool para fazer backup e sincronizar prioridades, OKRs,
                  backlog e perfil. Sem login, tudo continua salvo apenas neste dispositivo.
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={() => void sync.login("google")}
                  className="neo-brutal-button bg-yellow-400 text-black px-6 py-3 flex-1"
                >
                  ENTRAR COM GOOGLE
                </button>
                <button
                  onClick={() => void sync.login("email")}
                  className="neo-brutal-button bg-white text-black px-6 py-3 flex-1"
                >
                  <Mail className="w-5 h-5 inline mr-2" />
                  ENTRAR POR EMAIL
                </button>
              </div>
              <p className="text-sm text-gray-600 font-bold">
                O acesso abre no navegador e retorna ao app. Você também pode continuar sem conta:
                nenhum recurso local é bloqueado.
              </p>
            </>
          ) : account.status === "loading" ? (
            <div className="p-4 bg-gray-50 neo-brutal-border-thin font-black">VERIFICANDO SUA CONTA…</div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="font-black text-xl">{account.user?.name}</div>
                  <div className="text-gray-600 font-bold">{account.user?.email}</div>
                  <div className="text-sm text-gray-500 mt-1 font-bold">
                    CONTA {(account.user?.provider || "").toUpperCase()} · {STATUS_LABELS[account.status]}
                  </div>
                  {account.lastSyncedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Última sincronização: {new Date(account.lastSyncedAt).toLocaleString("pt-BR")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sync.syncNow()}
                    disabled={["choice", "conflict", "syncing"].includes(account.status)}
                    className="neo-brutal-button bg-yellow-400 text-black px-4 py-3 disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    SINCRONIZAR
                  </button>
                  <button
                    onClick={() => void sync.logout()}
                    className="neo-brutal-button bg-white text-black px-4 py-3"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    SAIR
                  </button>
                </div>
              </div>
              <div className="bg-green-50 p-4 neo-brutal-border-thin text-sm text-gray-700 font-medium">
                O app continua funcionando offline. Ao sair, os dados permanecem neste dispositivo,
                mas a sincronização é interrompida. No Mac, a sessão fica protegida no Keychain.
              </div>
            </>
          )}
          {account.error && (
            <div className="bg-red-50 p-3 neo-brutal-border-thin font-bold text-red-800">{account.error}</div>
          )}
        </div>
      </div>

      {(account.status === "choice" || account.status === "conflict") && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-2xl w-full">
            <div className="bg-yellow-400 p-4 border-b-2 border-black">
              <h3 className="text-2xl font-black">PROTEJA SUAS DUAS VERSÕES</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="font-bold text-gray-700">
                Há dados diferentes neste dispositivo e na nuvem. Uma cópia local de recuperação foi
                preservada. Escolha como continuar:
              </p>
              <button
                onClick={() => void sync.resolveConflict("merge")}
                disabled={!account.remote}
                className="neo-brutal-button bg-yellow-400 w-full p-4 text-left disabled:opacity-50"
              >
                <span className="block font-black">MESCLAR AS DUAS VERSÕES</span>
                <span className="text-sm font-medium">Reúne itens dos dois lados e mantém a versão mais recente de cada item.</span>
              </button>
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => void sync.resolveConflict("remote")}
                  disabled={!account.remote}
                  className="neo-brutal-button bg-blue-400 p-4 text-left disabled:opacity-50"
                >
                  <span className="block font-black">USAR A NUVEM</span>
                  <span className="text-sm font-medium">Substitui a versão visível deste dispositivo.</span>
                </button>
                <button
                  onClick={() => void sync.resolveConflict("local")}
                  className="neo-brutal-button bg-white p-4 text-left"
                >
                  <span className="block font-black">USAR ESTE DISPOSITIVO</span>
                  <span className="text-sm font-medium">Envia a versão local por cima da revisão atual.</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
