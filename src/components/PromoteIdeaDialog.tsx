import { useState } from "react";
import { AlertTriangle, ArrowUp, Calendar, X } from "lucide-react";
import type { BacklogItem } from "../types";

interface PromotionData {
  weekStart: string;
  notes: string;
}

interface PromoteIdeaDialogProps {
  item: BacklogItem;
  onConfirm: (data: PromotionData) => void;
  onCancel: () => void;
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return weekStart;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toShortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function PromoteIdeaDialog({ item, onConfirm, onCancel }: PromoteIdeaDialogProps) {
  const thisWeek = getWeekStart(new Date());
  const nextWeek = addDays(thisWeek, 7);
  const thisWeekDate = toDateString(thisWeek);
  const nextWeekDate = toDateString(nextWeek);
  const [notes, setNotes] = useState("");
  const [weekStart, setWeekStart] = useState(thisWeekDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-2xl w-full">
        <div className="bg-purple-500 p-6 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <ArrowUp className="w-6 h-6" />
              PROMOVER PARA PRIORIDADE SEMANAL
            </h2>
            <button
              onClick={onCancel}
              className="bg-white text-black p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 neo-brutal-border p-4">
            <h3 className="text-lg font-black text-black mb-2">IDEIA SELECIONADA:</h3>
            <h4 className="text-xl font-bold text-black mb-2">{item.title}</h4>
            {item.description && <p className="text-gray-700">{item.description}</p>}
          </div>

          <div className="bg-yellow-100 neo-brutal-border p-4 border-yellow-400">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-black text-yellow-800 mb-1">ATENÇÃO!</h4>
                <p className="text-yellow-700 font-medium text-sm">
                  Esta ação irá <strong>marcar a ideia como promovida</strong> no backlog. Você
                  precisará criar manualmente a prioridade semanal na página "SEMANA".
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2">PARA QUAL SEMANA?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWeekStart(thisWeekDate)}
                className={`neo-brutal-button py-3 text-black ${
                  weekStart === thisWeekDate
                    ? "bg-green-400 transform translate-x-1 translate-y-1"
                    : "bg-gray-100"
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                ESTA SEMANA
                <br />
                <span className="text-xs">
                  {toShortDate(thisWeek)} - {toShortDate(addDays(thisWeek, 6))}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(nextWeekDate)}
                className={`neo-brutal-button py-3 text-black ${
                  weekStart === nextWeekDate
                    ? "bg-blue-400 transform translate-x-1 translate-y-1"
                    : "bg-gray-100"
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                PRÓXIMA SEMANA
                <br />
                <span className="text-xs">
                  {toShortDate(nextWeek)} - {toShortDate(addDays(nextWeek, 6))}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2">
              NOTAS DE PROMOÇÃO (OPCIONAL)
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full p-4 neo-brutal-border h-24 bg-gray-50 resize-none"
              placeholder="Ex: Promovida devido à urgência do cliente X, necessária para o sprint atual..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onCancel}
              className="neo-brutal-button bg-gray-400 text-black px-6 py-3 flex-1"
            >
              CANCELAR
            </button>
            <button
              onClick={() => onConfirm({ weekStart, notes: notes.trim() })}
              className="neo-brutal-button bg-purple-500 text-white px-6 py-3 flex-1"
            >
              <ArrowUp className="w-4 h-4 inline mr-2" />
              CONFIRMAR PROMOÇÃO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
