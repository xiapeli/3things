import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  Focus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Target,
} from "lucide-react";
import { FinishWeekDialog } from "../components/FinishWeekDialog";
import { OkrPanel } from "../components/OkrPanel";
import { PriorityCard } from "../components/PriorityCard";
import { PriorityDialog } from "../components/PriorityDialog";
import type { PriorityDraft } from "../components/PriorityDialog";
import { useCollection } from "../hooks";
import { store } from "../store";
import type { Priority, PriorityScope } from "../types";
import { currentWeekStart, shiftWeek, weekLabel } from "../utils/dates";
import { allMilestonesStats, byPosition, weekStats } from "../utils/progress";

type BoardTab = "all" | PriorityScope;
const positions = [1, 2, 3] as const;
const positionColors = {
  1: "bg-yellow-400",
  2: "bg-blue-500",
  3: "bg-red-500",
};

export function WeeklyBoard() {
  const allPriorities = useCollection("priorities");
  const okrs = useCollection("okrs");
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [tab, setTab] = useState<BoardTab>("all");
  const [presentationMode, setPresentationMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [okrPanelOpen, setOkrPanelOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [finishWeekOpen, setFinishWeekOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<1 | 2 | 3>(1);
  const [priorityToEdit, setPriorityToEdit] = useState<Priority | null>(null);

  const weekPriorities = allPriorities.filter((priority) => priority.week_start === weekStart);
  const priorities = tab === "all"
    ? weekPriorities
    : weekPriorities.filter((priority) => priority.scope === tab);
  const stats = weekStats(priorities);
  const milestones = allMilestonesStats(priorities);

  function openNewPriority(position: 1 | 2 | 3) {
    setPriorityToEdit(null);
    setSelectedPosition(position);
    setDialogOpen(true);
  }

  function openEditPriority(priority: Priority) {
    setPriorityToEdit(priority);
    setSelectedPosition(priority.position);
    setDialogOpen(true);
  }

  function closePriorityDialog() {
    setDialogOpen(false);
    setPriorityToEdit(null);
  }

  function savePriority(draft: PriorityDraft) {
    if (priorityToEdit) {
      store.update("priorities", priorityToEdit.id, draft);
    } else {
      store.create("priorities", {
        ...draft,
        week_start: weekStart,
        position: selectedPosition,
        status: "not_started",
      });
    }
    closePriorityDialog();
  }

  function saveWeekReview(lessons: Record<string, string>) {
    Object.entries(lessons).forEach(([id, lesson]) => {
      store.update("priorities", id, { lessons_learned: lesson.trim() });
    });
    setFinishWeekOpen(false);
  }

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto ${presentationMode ? "pt-8" : ""}`}>
      {!presentationMode && !focusMode && (
        <>
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-black text-black mb-2 transform -rotate-1">SUAS 3 PRIORIDADES</h1>
                <p className="text-lg font-bold text-gray-600">SEMANA DE {weekLabel(weekStart)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Semana anterior" onClick={() => setWeekStart(shiftWeek(weekStart, -1))} className="neo-brutal-button bg-gray-400 text-black p-2">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setWeekStart(currentWeekStart())} className="neo-brutal-button bg-white text-black px-4 py-2 text-sm">
                  ESTA SEMANA
                </button>
                <button type="button" aria-label="Próxima semana" onClick={() => setWeekStart(shiftWeek(weekStart, 1))} className="neo-brutal-button bg-gray-400 text-black p-2">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex gap-2 neo-brutal-border p-1 bg-white">
              {([
                ["all", "TODAS"],
                ["individual", "MINHAS"],
                ["team", "EQUIPE"],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTab(value)}
                  className={`neo-brutal-button px-4 py-2 text-sm ${tab === value ? "bg-black text-white" : "bg-gray-100 text-black"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        <button type="button" onClick={() => setOkrPanelOpen(!okrPanelOpen)} className="neo-brutal-button bg-blue-500 text-white px-4 py-2">
          {okrPanelOpen ? <PanelLeftClose className="w-5 h-5 inline mr-2" /> : <PanelLeftOpen className="w-5 h-5 inline mr-2" />}
          {okrPanelOpen ? "FECHAR OKRS" : "PAINEL OKRS"}
        </button>
        <button type="button" onClick={() => setFocusMode(!focusMode)} className="neo-brutal-button bg-purple-500 text-white px-4 py-2">
          <Focus className="w-5 h-5 inline mr-2" />
          {focusMode ? "SAIR FOCO" : "MODO FOCO"}
        </button>
        <button type="button" onClick={() => setPresentationMode(!presentationMode)} className="neo-brutal-button bg-orange-400 text-black px-4 py-2">
          {presentationMode ? <EyeOff className="w-5 h-5 inline mr-2" /> : <Eye className="w-5 h-5 inline mr-2" />}
          {presentationMode ? "SAIR" : "APRESENTAR"}
        </button>
      </div>

      {!focusMode && (
        <div className="bg-white neo-brutal-border neo-brutal-shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-black">PROGRESSO DA SEMANA</h3>
            <span className="text-2xl font-black text-black">{stats.percent}%</span>
          </div>
          <div className="bg-gray-200 h-6 neo-brutal-border-thin mb-4">
            <div className="bg-green-400 h-full transition-all duration-500" style={{ width: `${stats.percent}%` }} />
          </div>
          <div className="pt-4 border-t-2 border-dashed border-gray-300">
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-600">MARCOS CONCLUÍDOS</span>
                  <span className="text-xs font-bold text-black">{milestones.percent}%</span>
                </div>
                <div className="bg-gray-200 h-2 neo-brutal-border-thin">
                  <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: `${milestones.percent}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{milestones.done}/{milestones.total}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <CircleCheck className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-3xl font-black text-black">{stats.completed}</p>
                  <p className="text-xs font-bold text-gray-600">CONCLUÍDAS</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-3xl font-black text-black">{stats.inProgress}</p>
                  <p className="text-xs font-bold text-gray-600">EM PROGRESSO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex gap-6 mb-8 ${okrPanelOpen ? "flex-col lg:flex-row" : ""}`}>
        <div className="grid md:grid-cols-3 gap-6 flex-1">
          {positions.map((position) => {
            const priority = byPosition(priorities, position);
            const color = positionColors[position];
            return (
              <div key={position} className="relative">
                <div className={`${color} neo-brutal-border neo-brutal-shadow p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-black">PRIORIDADE #{position}</h2>
                    <div className="bg-black text-white px-3 py-1 neo-brutal-border-thin transform rotate-3">
                      <span className="text-xs font-bold">#{position}</span>
                    </div>
                  </div>
                </div>
                {priority ? (
                  <PriorityCard
                    priority={priority}
                    okrs={okrs}
                    onUpdate={(id, patch) => store.update("priorities", id, patch)}
                    onEdit={openEditPriority}
                    onDelete={(id) => store.remove("priorities", id)}
                    color={color}
                  />
                ) : tab !== "all" ? (
                  <div
                    className="bg-white neo-brutal-border neo-brutal-shadow p-8 cursor-pointer hover:transform hover:translate-x-1 hover:translate-y-1 transition-transform"
                    onClick={() => openNewPriority(position)}
                  >
                    <div className="text-center">
                      <Plus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-xl font-bold text-gray-600 mb-2">ADICIONAR PRIORIDADE</p>
                      <p className="text-gray-500">Defina sua prioridade #{position}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 neo-brutal-border p-8">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-500">NENHUMA PRIORIDADE #{position}</p>
                      <p className="text-gray-400 text-sm">Use as abas MINHAS ou EQUIPE para criar</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {okrPanelOpen && (
          <div className="w-full lg:w-80 flex-shrink-0">
            <OkrPanel
              okrs={okrs}
              priorities={priorities}
              onConnectPriority={(priorityId, okrId) => store.update("priorities", priorityId, { okr_connection: okrId })}
              onClose={() => setOkrPanelOpen(false)}
            />
          </div>
        )}
      </div>

      {!presentationMode && !focusMode && (
        <div className="flex flex-wrap gap-4 justify-center">
          <button type="button" onClick={() => setFinishWeekOpen(true)} className="neo-brutal-button bg-green-400 text-black px-6 py-3">
            <CircleCheck className="w-5 h-5 inline mr-2" />FINALIZAR SEMANA
          </button>
          <button type="button" onClick={() => setOkrPanelOpen(true)} className="neo-brutal-button bg-purple-400 text-black px-6 py-3">
            <Target className="w-5 h-5 inline mr-2" />REVISAR OKRS
          </button>
        </div>
      )}

      {dialogOpen && (
        <PriorityDialog
          position={selectedPosition}
          okrs={okrs}
          scope={tab === "all" ? priorityToEdit?.scope ?? "individual" : tab}
          priorityToEdit={priorityToEdit}
          onSave={savePriority}
          onCancel={closePriorityDialog}
        />
      )}
      {finishWeekOpen && (
        <FinishWeekDialog
          priorities={weekPriorities}
          onSave={saveWeekReview}
          onCancel={() => setFinishWeekOpen(false)}
        />
      )}
    </div>
  );
}
