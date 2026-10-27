import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  Mail,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useData, useSync } from "../hooks";
import { AccountPanel } from "../components/AccountPanel";
import { downloadFile, store } from "../store";
import { currentWeekStart, formatFullDate } from "../utils/dates";

type TabId = "profile" | "data" | "settings";
type Notice = { type: "success" | "error"; text: string } | null;

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "PERFIL", icon: User },
  { id: "data", label: "DADOS", icon: Download },
  { id: "settings", label: "CONFIGURAÇÕES", icon: Settings },
];

export function Profile() {
  const { profile, priorities } = useData();
  const account = useSync();
  const [tab, setTab] = useState<TabId>("profile");
  const [notice, setNotice] = useState<Notice>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setEmail(profile?.email ?? "");
  }, [profile]);

  const saveProfile = () => {
    store.setProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      member_since: profile?.member_since ?? new Date().toISOString().slice(0, 10),
    });
    setNotice({ type: "success", text: "Perfil salvo neste dispositivo." });
  };

  const exportBackup = () => {
    downloadFile(
      `3things-backup-${new Date().toISOString().slice(0, 10)}.json`,
      store.exportJson(),
    );
    setNotice({ type: "success", text: "Backup JSON exportado com sucesso." });
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      store.importJson(await file.text());
      setNotice({ type: "success", text: "Backup importado. Seus dados foram restaurados." });
    } catch (error) {
      setNotice({
        type: "error",
        text: `Não foi possível importar: ${error instanceof Error ? error.message : "arquivo inválido"}`,
      });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const clearHistory = () => {
    const currentWeek = currentWeekStart();
    priorities
      .filter((priority) => priority.week_start < currentWeek)
      .forEach((priority) => store.remove("priorities", priority.id));
    setConfirmOpen(false);
    setConfirmText("");
    setNotice({
      type: "success",
      text: "Histórico de semanas passadas removido. A semana atual foi preservada.",
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-6xl font-black text-black mb-2 transform rotate-1">
          MEU PERFIL
        </h1>
        <p className="text-lg font-bold text-gray-600">GERENCIE SUA CONTA E DADOS</p>
      </div>

      {notice && (
        <div
          className={`mb-6 p-4 neo-brutal-border ${
            notice.type === "success" ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-bold text-black">{notice.text}</span>
            <button onClick={() => setNotice(null)} className="ml-auto text-gray-500 hover:text-black">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex overflow-x-auto border-b-4 border-black bg-gray-100">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`shrink-0 px-2 md:px-6 py-4 font-black text-[11px] md:text-sm flex items-center gap-1 md:gap-2 border-r-2 border-black last:border-r-0 ${
                tab === item.id ? "bg-white transform translate-y-1" : "hover:bg-gray-200"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "profile" && (
        <div className="space-y-8">
          <AccountPanel />

          <div className="bg-white neo-brutal-border neo-brutal-shadow">
            <div className="bg-blue-500 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                INFORMAÇÕES DA CONTA
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-black mb-2">NOME COMPLETO</label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Não informado"
                    className="w-full p-4 bg-gray-50 neo-brutal-border-thin font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-black mb-2">EMAIL</label>
                  <div className="p-4 bg-gray-50 neo-brutal-border-thin font-bold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Não informado"
                      className="w-full bg-transparent font-bold outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-black mb-2">MODO DE USO</label>
                  <div className="p-4 bg-gray-50 neo-brutal-border-thin font-bold">
                    {account.user ? "LOCAL + NUVEM" : "LOCAL"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-black mb-2">MEMBRO DESDE</label>
                  <div className="p-4 bg-gray-50 neo-brutal-border-thin font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {profile?.member_since ? formatFullDate(profile.member_since) : "Não informado"}
                  </div>
                </div>
              </div>
              <button
                onClick={saveProfile}
                className="neo-brutal-button bg-yellow-400 text-black px-6 py-3"
              >
                SALVAR PERFIL
              </button>
            </div>
          </div>

          <div className="bg-white neo-brutal-border neo-brutal-shadow">
            <div className="bg-green-400 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
              <h2 className="text-xl font-black text-black flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                SEUS DADOS
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-2xl font-black text-black mb-2">
                  {account.user ? "SALVO NO DISPOSITIVO E NA CONTA" : "TUDO SALVO LOCALMENTE"}
                </h3>
                <p className="text-gray-600">
                  {account.user
                    ? "Suas prioridades, OKRs e ideias ficam neste dispositivo e são sincronizados com sua conta privada hooks.cool. O app continua funcionando offline."
                    : "Suas prioridades, OKRs e ideias ficam somente neste dispositivo. Sem login, nada é enviado para servidores. Você pode exportar um backup na aba DADOS."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="space-y-8">
          <div className="bg-white neo-brutal-border neo-brutal-shadow">
            <div className="bg-green-400 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
              <h2 className="text-xl font-black text-black flex items-center gap-2">
                <Download className="w-5 h-5" />
                EXPORTAR DADOS
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium">
                Baixe todos os seus dados em um backup JSON para análise externa, backup pessoal ou
                para levar o 3things para outro dispositivo.
              </p>
              <div className="bg-gray-50 p-4 neo-brutal-border-thin">
                <h4 className="font-black text-black mb-2">O QUE SERÁ EXPORTADO:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Todas as prioridades semanais (completas e incompletas)</li>
                  <li>• Contexto, critérios de sucesso e resultados esperados</li>
                  <li>• Obstáculos enfrentados e lições aprendidas</li>
                  <li>• Conexões com OKRs e metas</li>
                  <li>• Ideias do backlog, perfil e datas de criação e modificação</li>
                </ul>
              </div>
              <button
                onClick={exportBackup}
                className="neo-brutal-button bg-blue-400 text-black px-6 py-3 w-full"
              >
                <Download className="w-5 h-5 inline mr-2" />
                EXPORTAR BACKUP COMPLETO
              </button>
              <button
                onClick={() => fileInput.current?.click()}
                className="neo-brutal-button bg-yellow-400 text-black px-6 py-3 w-full"
              >
                <Upload className="w-5 h-5 inline mr-2" />
                IMPORTAR BACKUP JSON
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => importBackup(event.target.files?.[0])}
              />
            </div>
          </div>

          <div className="bg-white neo-brutal-border neo-brutal-shadow">
            <div className="bg-red-500 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                ZONA DE PERIGO
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 p-4 neo-brutal-border border-red-300">
                <h4 className="font-black text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  ATENÇÃO: AÇÃO IRREVERSÍVEL
                </h4>
                <p className="text-red-700 text-sm font-medium">
                  Esta ação deletará permanentemente todo o seu histórico de prioridades de semanas
                  passadas. Suas prioridades da semana atual serão preservadas.
                </p>
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                className="neo-brutal-button bg-red-500 text-white px-6 py-3"
              >
                <Trash2 className="w-5 h-5 inline mr-2" />
                LIMPAR HISTÓRICO PERMANENTEMENTE
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-8">
          <div className="bg-white neo-brutal-border neo-brutal-shadow">
            <div className="bg-gray-400 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
              <h2 className="text-xl font-black text-black flex items-center gap-2">
                <Settings className="w-5 h-5" />
                CONFIGURAÇÕES DA CONTA
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 neo-brutal-border-thin">
                <p className="text-gray-700 font-medium">
                  O 3things funciona sem conta e sem assinatura. Com login opcional, os dados são
                  sincronizados pela conexão HTTPS com sua área privada no hooks.cool; sem login,
                  ficam apenas no armazenamento local. O backup manual continua disponível na aba DADOS.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white neo-brutal-border neo-brutal-shadow">
            <div className="bg-blue-400 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
              <h2 className="text-xl font-black text-black">SOBRE O 3THINGS</h2>
            </div>
            <div className="p-6">
              <div className="text-center space-y-4">
                <div className="bg-yellow-400 text-black px-6 py-3 neo-brutal-border inline-block transform -rotate-2">
                  <h1 className="text-3xl font-black">3THINGS</h1>
                </div>
                <p className="text-gray-600 font-medium">Versão 1.0 - Foco Implacável em Resultados</p>
                <p className="text-sm text-gray-500">
                  © 2024 3THINGS. Construído para profissionais que executam.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-md w-full">
            <div className="bg-red-500 p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                ATENÇÃO: AÇÃO IRREVERSÍVEL
              </h3>
            </div>
            <div className="p-6">
              <p className="text-black font-bold mb-4">
                Você está prestes a deletar PERMANENTEMENTE todo o seu histórico de prioridades de
                semanas passadas. Esta ação não pode ser desfeita.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Para confirmar, digite exatamente: <strong>DELETAR TUDO</strong>
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                className="w-full p-3 neo-brutal-border bg-gray-50 font-bold mb-4"
                placeholder="Digite: DELETAR TUDO"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    setConfirmText("");
                  }}
                  className="neo-brutal-button bg-gray-400 text-black px-4 py-2 flex-1"
                >
                  CANCELAR
                </button>
                <button
                  onClick={clearHistory}
                  disabled={confirmText !== "DELETAR TUDO"}
                  className={`neo-brutal-button px-4 py-2 flex-1 ${
                    confirmText === "DELETAR TUDO"
                      ? "bg-red-500 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  CONFIRMAR EXCLUSÃO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
