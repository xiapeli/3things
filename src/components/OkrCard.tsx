import { useState } from "react";
import { Calendar, Check, Edit3, Target, Trash2 } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import type { KeyResult, OKR, OkrColor, OkrPeriod } from "../types";

const colorClasses: Record<OkrColor, string> = {
  yellow: "bg-yellow-400",
  red: "bg-red-500 text-white",
  blue: "bg-blue-500 text-white",
  green: "bg-green-400",
  purple: "bg-purple-500 text-white",
};

const periodLabels: Record<OkrPeriod, string> = {
  monthly: "MENSAL",
  quarterly: "TRIMESTRAL",
  semi_annual: "SEMESTRAL",
  annual: "ANUAL",
};

function formatTargetDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

interface OkrCardProps {
  okr: OKR;
  onUpdate: (id: string, patch: Partial<OKR>) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export function OkrCard({ okr, onUpdate, onDelete, onEdit }: OkrCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateKeyResult = (id: string, patch: Partial<KeyResult>) => {
    const keyResults = okr.key_results.map((keyResult) =>
      keyResult.id === id ? { ...keyResult, ...patch } : keyResult,
    );
    const completed = keyResults.filter((keyResult) => keyResult.completed).length;
    const progress =
      keyResults.length > 0 ? Math.round((completed / keyResults.length) * 100) : 0;

    onUpdate(okr.id, { key_results: keyResults, progress });
  };

  const toggleKeyResult = (id: string) => {
    const keyResult = okr.key_results.find((result) => result.id === id);
    if (keyResult) {
      updateKeyResult(id, { completed: !keyResult.completed });
    }
  };

  const updateCurrent = (id: string, value: string) => {
    const keyResult = okr.key_results.find((result) => result.id === id);
    if (keyResult) {
      const target = parseFloat(keyResult.target) || 1;
      const current = parseFloat(value) || 0;
      updateKeyResult(id, { current, completed: current >= target });
    }
  };

  return (
    <div className="bg-white neo-brutal-border neo-brutal-shadow">
      <div
        className={`${colorClasses[okr.color]} p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <span className="font-black text-sm">{periodLabels[okr.period]}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              aria-label="Editar OKR"
              className="bg-black text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Deletar OKR"
              className="bg-red-600 text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black text-black mb-3 leading-tight">{okr.title}</h3>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-600">
            ATÉ {formatTargetDate(okr.target_date)}
          </span>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-black text-black">PROGRESSO GERAL</span>
            <span className="text-lg font-black text-black">{okr.progress}%</span>
          </div>
          <div className="bg-gray-200 h-4 neo-brutal-border-thin">
            <div
              className="bg-green-400 h-full transition-all duration-500"
              style={{ width: `${okr.progress}%` }}
            />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-black text-black mb-3">KEY RESULTS:</h4>
          <div className="space-y-2">
            {okr.key_results?.map((keyResult, index) => (
              <div key={keyResult.id} className="bg-gray-50 p-3 neo-brutal-border-thin">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => toggleKeyResult(keyResult.id)}
                        aria-label={`${keyResult.completed ? "Desmarcar" : "Marcar"} KR${index + 1} como concluído`}
                        className={`w-5 h-5 neo-brutal-border-thin flex items-center justify-center ${keyResult.completed ? "bg-green-400" : "bg-white"}`}
                      >
                        {keyResult.completed && <Check className="w-3 h-3 text-black" />}
                      </button>
                      <span
                        className={`text-sm font-bold ${keyResult.completed ? "line-through text-gray-500" : "text-black"}`}
                      >
                        KR{index + 1}: {keyResult.description}
                      </span>
                    </div>
                    <div className="ml-7">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={keyResult.current || 0}
                          onChange={(event) => updateCurrent(keyResult.id, event.target.value)}
                          className="w-16 p-1 neo-brutal-border-thin text-xs text-center"
                          min="0"
                          aria-label={`Valor atual de KR${index + 1}`}
                        />
                        <span className="text-xs text-gray-600">
                          / {keyResult.target} {keyResult.unit}
                        </span>
                        <div className="flex-1 bg-gray-200 h-2 neo-brutal-border-thin ml-2">
                          <div
                            className="bg-blue-400 h-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, ((keyResult.current || 0) / (parseFloat(keyResult.target) || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="DELETAR OKR?"
        description={`Deletar “${okr.title}” e seus key results? Esta ação será sincronizada com sua conta.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDelete(okr.id);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
