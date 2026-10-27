import { useState } from "react";
import type { DragEvent } from "react";
import { ArrowRight, Link2, Target, X } from "lucide-react";
import type { OKR, Priority } from "../types";
import { formatFullDate } from "../utils/dates";
import { okrPercent } from "../utils/progress";

interface OkrPanelProps {
  okrs: OKR[];
  priorities: Priority[];
  onConnectPriority: (priorityId: string, okrId: string) => void;
  onClose: () => void;
}

export function OkrPanel({ okrs, priorities, onConnectPriority, onClose }: OkrPanelProps) {
  const [dragOverOkr, setDragOverOkr] = useState<string | null>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>, okrId: string) {
    event.preventDefault();
    const priorityId = event.dataTransfer.getData("text/plain");
    if (priorityId) onConnectPriority(priorityId, okrId);
    setDragOverOkr(null);
  }

  function progressColor(progress: number) {
    if (progress >= 100) return "bg-green-400";
    if (progress >= 50) return "bg-yellow-400";
    return "bg-red-400";
  }

  return (
    <div className="bg-white neo-brutal-border neo-brutal-shadow h-full flex flex-col">
      <div className="p-4 bg-black border-b-2 border-black flex items-center justify-between">
        <h2 className="font-black text-white flex items-center gap-2">
          <Target className="w-5 h-5" />OKRS ATIVOS
        </h2>
        <button type="button" aria-label="Fechar OKRs" onClick={onClose} className="text-white hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-3 bg-yellow-100 border-b-2 border-black">
        <p className="text-xs font-bold text-black flex items-center gap-1">
          <ArrowRight className="w-4 h-4" />ARRASTE UMA PRIORIDADE PARA CONECTÁ-LA
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {okrs.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-bold text-gray-500">Nenhum OKR ativo.</p>
            <p className="text-xs text-gray-400">Crie OKRs para conectar suas prioridades.</p>
          </div>
        ) : (
          okrs.map((okr) => {
            const connected = priorities.filter((priority) => priority.okr_connection === okr.id);
            const progress = okrPercent(okr);
            const isDraggingOver = dragOverOkr === okr.id;
            return (
              <div
                key={okr.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "link";
                  setDragOverOkr(okr.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDragOverOkr(null);
                  }
                }}
                onDrop={(event) => handleDrop(event, okr.id)}
                className={`p-3 neo-brutal-border-thin transition-all duration-150 ${isDraggingOver ? "bg-green-100 border-green-500 scale-105 shadow-lg" : "bg-gray-50"}`}
              >
                <p className="font-black text-black text-sm mb-2 break-words">{okr.title}</p>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500">
                  <span className="px-1.5 py-0.5 bg-black text-white">{okr.period.toUpperCase()}</span>
                  {okr.target_date && <span>{formatFullDate(okr.target_date).slice(0, 6) + formatFullDate(okr.target_date).slice(8)}</span>}
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-600">PROGRESSO</span>
                    <span className="text-xs font-black text-black">{progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-300 neo-brutal-border-thin overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${progressColor(progress)}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="border-t-2 border-black pt-2 mt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Link2 className="w-3 h-3 text-gray-600" />
                    <span className="text-xs font-bold text-gray-600">
                      {connected.length} PRIORIDADE{connected.length !== 1 ? "S" : ""} CONECTADA{connected.length !== 1 ? "S" : ""}
                    </span>
                  </div>
                  {connected.length > 0 && (
                    <div className="space-y-1">
                      {connected.map((priority) => (
                        <div key={priority.id} className="text-xs font-bold text-black bg-white neo-brutal-border-thin px-2 py-1 truncate">
                          #{priority.position} - {priority.title}
                        </div>
                      ))}
                    </div>
                  )}
                  {isDraggingOver && <div className="text-xs font-black text-green-600 mt-1 animate-pulse">⬇ SOLTE PARA CONECTAR</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
