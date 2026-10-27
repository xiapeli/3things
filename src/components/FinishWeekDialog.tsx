import { useState } from "react";
import type { FormEvent } from "react";
import { Check, CircleAlert, CircleCheck, Clock, X } from "lucide-react";
import type { Priority } from "../types";
import { weekStats } from "../utils/progress";

interface FinishWeekDialogProps {
  priorities: Priority[];
  onSave: (lessons: Record<string, string>) => void;
  onCancel: () => void;
}

export function FinishWeekDialog({ priorities, onSave, onCancel }: FinishWeekDialogProps) {
  const completed = priorities.filter((priority) => priority.status === "completed");
  const stats = weekStats(priorities);
  const notStarted = stats.total - stats.completed - stats.inProgress;
  const [lessons, setLessons] = useState<Record<string, string>>(() =>
    Object.fromEntries(completed.map((priority) => [priority.id, priority.lessons_learned ?? ""])),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(lessons);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="bg-green-400 p-6 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-black">FINALIZAR SEMANA</h2>
            <button type="button" aria-label="Fechar" onClick={onCancel} className="bg-black text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-black mb-4">RESUMO DA SEMANA</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-100 p-4 neo-brutal-border-thin text-center">
                <CircleCheck className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-black text-black">{stats.completed}</p>
                <p className="text-xs font-bold text-gray-600">CONCLUÍDAS</p>
              </div>
              <div className="bg-yellow-100 p-4 neo-brutal-border-thin text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-black text-black">{stats.inProgress}</p>
                <p className="text-xs font-bold text-gray-600">EM PROGRESSO</p>
              </div>
              <div className="bg-red-100 p-4 neo-brutal-border-thin text-center">
                <CircleAlert className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-black text-black">{notStarted}</p>
                <p className="text-xs font-bold text-gray-600">NÃO INICIADAS</p>
              </div>
            </div>
          </div>

          {completed.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-black">LIÇÕES APRENDIDAS</h3>
              {completed.map((priority) => (
                <div key={priority.id} className="bg-gray-50 p-4 neo-brutal-border-thin">
                  <label className="block text-sm font-black text-black mb-2">
                    #{priority.position} - {priority.title}
                  </label>
                  <textarea
                    value={lessons[priority.id] ?? ""}
                    onChange={(event) => setLessons((current) => ({ ...current, [priority.id]: event.target.value }))}
                    className="w-full p-4 neo-brutal-border h-24 bg-white resize-none"
                    placeholder="O que você aprendeu ao concluir esta prioridade?"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="bg-gray-100 p-4 neo-brutal-border-thin text-sm font-bold text-gray-600 text-center">
              Nenhuma prioridade concluída nesta semana.
            </p>
          )}

          <div className="flex gap-4 pt-8 mt-6 border-t-4 border-black">
            <button type="button" onClick={onCancel} className="neo-brutal-button bg-gray-400 text-black px-6 py-3 flex-1">
              CANCELAR
            </button>
            <button type="submit" className="neo-brutal-button bg-green-400 text-black px-6 py-3 flex-1">
              <Check className="w-5 h-5 inline mr-2" />SALVAR REVISÃO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
