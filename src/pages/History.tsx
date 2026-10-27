import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Lightbulb,
  MousePointer2,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useCollection } from "../hooks";
import { downloadFile, store } from "../store";
import type { Priority } from "../types";
import { formatDayMonth, formatFullDate } from "../utils/dates";
import { completionRate, okrPercent } from "../utils/progress";

const colorStyles = {
  yellow: { bg: "bg-yellow-400", text: "text-black" },
  red: { bg: "bg-red-500", text: "text-white" },
  blue: { bg: "bg-blue-500", text: "text-white" },
  green: { bg: "bg-green-400", text: "text-black" },
  purple: { bg: "bg-purple-500", text: "text-white" },
};

function StatusIcon({ status }: { status: Priority["status"] }) {
  if (status === "completed") {
    return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
  }
  if (status === "in_progress") {
    return <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />;
  }
  return <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />;
}

function formatShortDate(iso: string): string {
  const [day, month, year] = formatFullDate(iso).split("/");
  return `${day}/${month}/${year.slice(-2)}`;
}

function escapeCsv(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function History() {
  const priorities = useCollection("priorities");
  const okrs = useCollection("okrs");
  const [selectedOkrId, setSelectedOkrId] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const sortedPriorities = useMemo(
    () => [...priorities].sort((a, b) => b.week_start.localeCompare(a.week_start)),
    [priorities],
  );
  const sortedOkrs = useMemo(
    () => [...okrs].sort((a, b) => b.created_date.localeCompare(a.created_date)),
    [okrs],
  );
  const selectedOkr = sortedOkrs.find((okr) => okr.id === selectedOkrId) ?? sortedOkrs[0];
  const selectedPriorities = selectedOkr
    ? sortedPriorities.filter((priority) => priority.okr_connection === selectedOkr.id)
    : [];
  const completed = priorities.filter((priority) => priority.status === "completed").length;
  const inProgress = priorities.filter((priority) => priority.status === "in_progress").length;

  const weeklyData = useMemo(() => {
    const weeks: Record<
      string,
      { completed: number; total: number; priorities: Priority[] }
    > = {};
    sortedPriorities.forEach((priority) => {
      const week = weeks[priority.week_start] ?? { completed: 0, total: 0, priorities: [] };
      week.total += 1;
      if (priority.status === "completed") week.completed += 1;
      week.priorities.push(priority);
      weeks[priority.week_start] = week;
    });
    return Object.entries(weeks).sort(([a], [b]) => b.localeCompare(a));
  }, [sortedPriorities]);

  const exportHistory = () => {
    try {
      const headers = [
        "Semana",
        "Posição",
        "Título",
        "Descrição",
        "Status",
        "Horas Estimadas",
        "Obstáculos",
        "Lições Aprendidas",
        "Notas de Conclusão",
        "OKR Conectado",
        "Data de Criação",
      ];
      const rows = sortedPriorities.map((priority) =>
        [
          priority.week_start,
          priority.position,
          priority.title,
          priority.description,
          priority.status,
          priority.estimated_hours,
          priority.obstacles,
          priority.lessons_learned,
          priority.completion_notes,
          priority.okr_connection,
          priority.created_date,
        ]
          .map(escapeCsv)
          .join(","),
      );
      const date = new Date().toISOString().split("T")[0];
      downloadFile(
        `historico-prioridades-${date}.csv`,
        [headers.join(","), ...rows].join("\n"),
        "text/csv",
      );
    } catch (error) {
      setNotice({ type: "error", text: `Erro ao exportar histórico: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const clearHistory = () => {
    if (confirmation !== "DELETAR TUDO") {
      setNotice({ type: "error", text: "Digite exatamente: DELETAR TUDO" });
      return;
    }
    try {
      store.clearHistory();
      setNotice({ type: "success", text: "Histórico limpo com sucesso!" });
      setShowClearModal(false);
      setConfirmation("");
    } catch (error) {
      setNotice({ type: "error", text: `Erro ao limpar histórico: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const closeClearModal = () => {
    setShowClearModal(false);
    setConfirmation("");
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-black mb-2 transform -rotate-1">
              CENTRAL DE ANÁLISE E IMPACTO
            </h1>
            <p className="text-lg font-bold text-gray-600">
              {okrs.length > 0
                ? "REVISE O IMPACTO DAS SUAS PRIORIDADES NOS SEUS OBJETIVOS"
                : "ANALISE O DESEMPENHO DAS SUAS PRIORIDADES SEMANAIS"}
            </p>
          </div>
          {priorities.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportHistory}
                className="neo-brutal-button bg-blue-400 text-black px-4 py-2 text-sm"
              >
                <Download className="w-4 h-4 inline mr-1" />
                EXPORTAR CSV
              </button>
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="neo-brutal-button bg-red-500 text-white px-4 py-2 text-sm"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                LIMPAR HISTÓRICO
              </button>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className={`mb-6 p-4 neo-brutal-border font-bold ${notice.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`} role="status">
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} className="ml-4" aria-label="Fechar aviso">×</button>
        </div>
      )}

      {priorities.length === 0 ? (
        <div className="text-center py-12 bg-white neo-brutal-border neo-brutal-shadow p-8">
          <Target className="w-24 h-24 mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-black text-gray-600 mb-2">
            NENHUMA PRIORIDADE REGISTRADA
          </h3>
          <p className="text-gray-500">
            Comece definindo suas prioridades semanais para gerar insights de desempenho.
          </p>
        </div>
      ) : okrs.length > 0 ? (
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="bg-white neo-brutal-border neo-brutal-shadow">
              <div className="p-4 bg-black">
                <h2 className="font-black text-white">SELECIONE UM OKR</h2>
              </div>
              <div className="p-2 space-y-2">
                {sortedOkrs.map((okr) => {
                  const colors = colorStyles[okr.color];
                  const selected = selectedOkr?.id === okr.id;
                  return (
                    <button
                      type="button"
                      key={okr.id}
                      onClick={() => setSelectedOkrId(okr.id)}
                      className={`w-full p-4 neo-brutal-border text-left ${
                        selected ? `${colors.bg} ${colors.text}` : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <p className="font-black truncate">{okr.title}</p>
                      <div className="bg-gray-200/50 h-2 mt-2 neo-brutal-border-thin">
                        <div
                          className="bg-green-400 h-full"
                          style={{ width: `${okrPercent(okr)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="md:col-span-8">
            {selectedOkr ? (
              <div className="space-y-8">
                <div className="bg-white neo-brutal-border neo-brutal-shadow">
                  <div
                    className={`p-4 ${colorStyles[selectedOkr.color].bg} ${
                      colorStyles[selectedOkr.color].text
                    }`}
                  >
                    <h2 className="text-2xl font-black truncate">{selectedOkr.title}</h2>
                    <p className="font-bold text-sm">
                      Período: {selectedOkr.period} | Alvo: {formatFullDate(selectedOkr.target_date)}
                    </p>
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-black mb-2">KEY RESULTS</h3>
                    {(selectedOkr.key_results ?? []).map((keyResult) => (
                      <div
                        key={keyResult.id}
                        className="mb-2 p-2 bg-gray-50 border-l-4 border-gray-300"
                      >
                        <p className="font-bold text-black">{keyResult.description}</p>
                        <p className="text-sm text-gray-600">
                          Progresso: {keyResult.current || 0} / {keyResult.target} {keyResult.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-black mb-4">LINHA DO TEMPO DE IMPACTO</h3>
                  <div className="space-y-4">
                    {selectedPriorities.length > 0 ? (
                      selectedPriorities.map((priority) => (
                        <div
                          key={priority.id}
                          className="bg-white neo-brutal-border neo-brutal-shadow p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-gray-500">
                                SEMANA {formatShortDate(priority.week_start)}
                              </p>
                              <p className="font-black text-black">{priority.title}</p>
                            </div>
                            <StatusIcon status={priority.status} />
                          </div>
                          {priority.completion_notes && (
                            <p className="text-sm mt-2 text-gray-700 bg-gray-100 p-2">
                              <Lightbulb className="w-4 h-4 inline-block mr-1" />
                              {priority.completion_notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">
                        Nenhuma prioridade foi conectada a este OKR ainda.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-red-500" />
                      OBSTÁCULOS RECORRENTES
                    </h3>
                    <div className="space-y-2">
                      {selectedPriorities
                        .filter((priority) => priority.obstacles)
                        .map((priority) => (
                          <p
                            key={priority.id}
                            className="text-sm bg-red-100 p-2 neo-brutal-border-thin border-red-300"
                          >
                            {priority.obstacles}
                          </p>
                        ))}
                      {selectedPriorities.filter((priority) => priority.obstacles).length === 0 && (
                        <p className="text-sm text-gray-500">Nenhum obstáculo registrado.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                      <Lightbulb className="text-yellow-500" />
                      PRINCIPAIS APRENDIZADOS
                    </h3>
                    <div className="space-y-2">
                      {selectedPriorities
                        .filter((priority) => priority.lessons_learned)
                        .map((priority) => (
                          <p
                            key={priority.id}
                            className="text-sm bg-yellow-100 p-2 neo-brutal-border-thin border-yellow-300"
                          >
                            {priority.lessons_learned}
                          </p>
                        ))}
                      {selectedPriorities.filter((priority) => priority.lessons_learned).length ===
                        0 && (
                        <p className="text-sm text-gray-500">Nenhuma lição aprendida registrada.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white neo-brutal-border neo-brutal-shadow p-8 h-full flex flex-col justify-center items-center">
                <MousePointer2 className="w-16 h-16 text-gray-400 mb-4 animate-pulse" />
                <h3 className="text-xl font-black text-gray-600">SELECIONE UM OKR</h3>
                <p className="text-gray-500">
                  Escolha um objetivo na lista ao lado para começar sua análise.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-500 neo-brutal-border neo-brutal-shadow p-6">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-white" />
                <div>
                  <p className="text-2xl font-black text-white">{priorities.length}</p>
                  <p className="text-sm font-bold text-white">TOTAL PRIORIDADES</p>
                </div>
              </div>
            </div>
            <div className="bg-green-400 neo-brutal-border neo-brutal-shadow p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-black" />
                <div>
                  <p className="text-2xl font-black text-black">{completed}</p>
                  <p className="text-sm font-bold text-black">CONCLUÍDAS</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-400 neo-brutal-border neo-brutal-shadow p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-black" />
                <div>
                  <p className="text-2xl font-black text-black">{inProgress}</p>
                  <p className="text-sm font-bold text-black">EM PROGRESSO</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-500 neo-brutal-border neo-brutal-shadow p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-white" />
                <div>
                  <p className="text-2xl font-black text-white">{completionRate(priorities)}%</p>
                  <p className="text-sm font-bold text-white">TAXA DE SUCESSO</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black text-black mb-4">HISTÓRICO SEMANAL</h3>
            <div className="space-y-4">
              {weeklyData.map(([week, data]) => (
                <div key={week} className="bg-white neo-brutal-border neo-brutal-shadow">
                  <div className="p-4 bg-gray-100 border-b-2 border-black">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-black">
                        <Calendar className="w-5 h-5 inline mr-2" />
                        SEMANA DE {formatFullDate(week)}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-600">
                          {data.completed}/{data.total} CONCLUÍDAS
                        </span>
                        <div className="w-16 h-2 bg-gray-300 neo-brutal-border-thin">
                          <div
                            className="h-full bg-green-400"
                            style={{ width: `${(data.completed / data.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {data.priorities.map((priority) => (
                        <div
                          key={priority.id}
                          className="flex items-start justify-between p-3 bg-gray-50 neo-brutal-border-thin"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon status={priority.status} />
                              <span className="font-bold text-black">
                                #{priority.position} - {priority.title}
                              </span>
                            </div>
                            {priority.description && (
                              <p className="text-sm text-gray-600 ml-7">{priority.description}</p>
                            )}
                            {priority.completion_notes && (
                              <p className="text-sm text-gray-700 bg-yellow-100 p-2 mt-2 ml-7">
                                <Lightbulb className="w-4 h-4 inline mr-1" />
                                {priority.completion_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                OBSTÁCULOS MAIS COMUNS
              </h3>
              <div className="space-y-2">
                {sortedPriorities
                  .filter((priority) => priority.obstacles?.trim())
                  .map((priority) => (
                    <p
                      key={priority.id}
                      className="text-sm bg-red-100 p-2 neo-brutal-border-thin border-red-300"
                    >
                      <span className="font-bold">Semana {formatDayMonth(priority.week_start)}:</span>{" "}
                      {priority.obstacles}
                    </p>
                  ))}
                {sortedPriorities.filter((priority) => priority.obstacles?.trim()).length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum obstáculo registrado ainda.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
                <Lightbulb className="text-yellow-500" />
                PRINCIPAIS APRENDIZADOS
              </h3>
              <div className="space-y-2">
                {sortedPriorities
                  .filter((priority) => priority.lessons_learned?.trim())
                  .map((priority) => (
                    <p
                      key={priority.id}
                      className="text-sm bg-yellow-100 p-2 neo-brutal-border-thin border-yellow-300"
                    >
                      <span className="font-bold">Semana {formatDayMonth(priority.week_start)}:</span>{" "}
                      {priority.lessons_learned}
                    </p>
                  ))}
                {sortedPriorities.filter((priority) => priority.lessons_learned?.trim()).length ===
                  0 && (
                  <p className="text-sm text-gray-500">Nenhuma lição aprendida registrada ainda.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-500 neo-brutal-border neo-brutal-shadow p-6 text-center">
            <h3 className="text-2xl font-black text-white mb-2">
              QUER INSIGHTS AINDA MAIS PROFUNDOS?
            </h3>
            <p className="text-white font-bold mb-4">
              Conecte suas prioridades a OKRs e veja como elas impactam seus objetivos de longo prazo.
            </p>
            <button
              type="button"
              className="neo-brutal-button bg-yellow-400 text-black px-6 py-3"
            >
              <Target className="w-5 h-5 inline mr-2" />
              CRIAR MEU PRIMEIRO OKR
            </button>
          </div>
        </div>
      )}

      {showClearModal && (
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
                Você está prestes a deletar PERMANENTEMENTE todas as suas prioridades e histórico.
                Esta ação não pode ser desfeita.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Para confirmar, digite exatamente: <strong>DELETAR TUDO</strong>
              </p>
              <input
                type="text"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full p-3 neo-brutal-border bg-gray-50 font-bold mb-4"
                placeholder="Digite: DELETAR TUDO"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeClearModal}
                  className="neo-brutal-button bg-gray-400 text-black px-4 py-2 flex-1"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={clearHistory}
                  disabled={confirmation !== "DELETAR TUDO"}
                  className={`neo-brutal-button px-4 py-2 flex-1 ${
                    confirmation === "DELETAR TUDO"
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
