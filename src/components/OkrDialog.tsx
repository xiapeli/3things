import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Target, X } from "lucide-react";
import type { KeyResult, OKR, OkrColor, OkrPeriod } from "../types";

export type OkrFormData = Omit<OKR, "id" | "created_date" | "updated_date">;

type KeyResultDraft = Pick<KeyResult, "description" | "target" | "unit">;

const emptyDraft: KeyResultDraft = { description: "", target: "", unit: "" };

const colors: { value: OkrColor; color: string; label: string }[] = [
  { value: "yellow", color: "bg-yellow-400", label: "AMARELO" },
  { value: "red", color: "bg-red-500", label: "VERMELHO" },
  { value: "blue", color: "bg-blue-500", label: "AZUL" },
  { value: "green", color: "bg-green-400", label: "VERDE" },
  { value: "purple", color: "bg-purple-500", label: "ROXO" },
];

interface OkrDialogProps {
  okr?: OKR;
  onSave: (data: OkrFormData) => void;
  onCancel: () => void;
}

export function OkrDialog({ okr, onSave, onCancel }: OkrDialogProps) {
  const [title, setTitle] = useState(okr?.title ?? "");
  const [period, setPeriod] = useState<OkrPeriod>(okr?.period ?? "quarterly");
  const [targetDate, setTargetDate] = useState(okr?.target_date ?? "");
  const [color, setColor] = useState<OkrColor>(okr?.color ?? "yellow");
  const [keyResults, setKeyResults] = useState<KeyResult[]>(okr?.key_results ?? []);
  const [draft, setDraft] = useState<KeyResultDraft>(emptyDraft);

  const addKeyResult = () => {
    if (draft.description.trim() && draft.target.trim()) {
      const keyResult: KeyResult = {
        id: `kr-${Date.now()}`,
        description: draft.description.trim(),
        target: draft.target.trim(),
        unit: draft.unit.trim(),
        current: 0,
        completed: false,
      };
      setKeyResults([...keyResults, keyResult]);
      setDraft(emptyDraft);
    }
  };

  const removeKeyResult = (id: string) => {
    setKeyResults(keyResults.filter((keyResult) => keyResult.id !== id));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !targetDate || keyResults.length === 0) return;

    const completed = keyResults.filter((keyResult) => keyResult.completed).length;
    onSave({
      title: title.trim(),
      key_results: keyResults,
      period,
      target_date: targetDate,
      color,
      progress: okr ? Math.round((completed / keyResults.length) * 100) : 0,
    });
  };

  const canSave = Boolean(title.trim() && targetDate && keyResults.length > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="bg-blue-500 p-6 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Target className="w-6 h-6" />
              {okr ? "EDITAR OKR" : "NOVO OKR"}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Fechar"
              className="bg-white text-black p-2 neo-brutal-border-thin transform hover:rotate-45 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-black text-black mb-2">
              OBJETIVO (O que você quer alcançar?) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full p-4 neo-brutal-border text-lg font-bold bg-gray-50"
              placeholder="Ex: Aumentar o engajamento dos usuários"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              O objetivo deve ser inspirador e qualitativo
            </p>
          </div>
          <div>
            <label className="block text-sm font-black text-black mb-2">
              KEY RESULTS (Como você medirá o sucesso?) *
            </label>
            <div className="bg-gray-50 p-4 neo-brutal-border-thin mb-4">
              <h4 className="text-sm font-bold text-black mb-3">ADICIONAR KEY RESULT:</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  className="w-full p-3 neo-brutal-border-thin bg-white font-bold"
                  placeholder="Descrição do resultado (Ex: Aumentar tempo médio de sessão)"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={draft.target}
                    onChange={(event) => setDraft({ ...draft, target: event.target.value })}
                    className="p-3 neo-brutal-border-thin bg-white font-bold"
                    placeholder="Meta (Ex: 15)"
                  />
                  <input
                    type="text"
                    value={draft.unit}
                    onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                    className="p-3 neo-brutal-border-thin bg-white font-bold"
                    placeholder="Unidade (Ex: minutos)"
                  />
                </div>
                <button
                  type="button"
                  onClick={addKeyResult}
                  className="neo-brutal-button bg-green-400 text-black px-4 py-2 w-full"
                  disabled={!draft.description.trim() || !draft.target.trim()}
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  ADICIONAR KEY RESULT
                </button>
              </div>
            </div>
            {keyResults.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-bold text-black">KEY RESULTS DEFINIDOS:</h4>
                {keyResults.map((keyResult, index) => (
                  <div
                    key={keyResult.id}
                    className="flex items-center justify-between p-3 bg-white neo-brutal-border-thin"
                  >
                    <div>
                      <span className="font-bold text-black">
                        KR{index + 1}: {keyResult.description}
                      </span>
                      <p className="text-sm text-gray-600">
                        Meta: {keyResult.target} {keyResult.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeKeyResult(keyResult.id)}
                      aria-label={`Remover KR${index + 1}`}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {keyResults.length === 0 && (
              <p className="text-gray-500 text-center py-4 text-sm">
                Adicione pelo menos 1 Key Result para continuar
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-black mb-2">PERÍODO *</label>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as OkrPeriod)}
                className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
                required
              >
                <option value="monthly">MENSAL</option>
                <option value="quarterly">TRIMESTRAL</option>
                <option value="semi_annual">SEMESTRAL</option>
                <option value="annual">ANUAL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-2">DATA ALVO *</label>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-black text-black mb-2">COR IDENTIFICADORA</label>
            <div className="grid grid-cols-5 gap-3">
              {colors.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={`neo-brutal-button py-3 text-black text-xs ${option.color} ${color === option.value ? "transform translate-x-1 translate-y-1" : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="neo-brutal-button bg-gray-400 text-black px-6 py-3 flex-1"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className={`neo-brutal-button px-6 py-3 flex-1 ${canSave ? "bg-green-400 text-black" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              {okr ? "SALVAR ALTERAÇÕES" : "CRIAR OKR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
