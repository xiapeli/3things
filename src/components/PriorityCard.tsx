import { useState } from "react";
import {
  Calendar,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  Lightbulb,
  Link2,
  Shield,
  SquarePen,
  Trash2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  OKR,
  Priority,
  PriorityFlexibility,
  PriorityStatus,
} from "../types";
import { formatDayMonth } from "../utils/dates";
import { milestoneCounts, milestonePercent } from "../utils/progress";
import { ConfirmDialog } from "./ConfirmDialog";

interface PriorityCardProps {
  priority: Priority;
  okrs: OKR[];
  onUpdate: (id: string, patch: Partial<Priority>) => void;
  onEdit: (priority: Priority) => void;
  onDelete: (id: string) => void;
  color: string;
}

const statusConfig: Record<
  PriorityStatus,
  { icon: LucideIcon; color: string; label: string }
> = {
  not_started: { icon: CircleAlert, color: "text-red-500", label: "NÃO INICIADO" },
  in_progress: { icon: Clock, color: "text-yellow-600", label: "EM PROGRESSO" },
  completed: { icon: CircleCheck, color: "text-green-500", label: "CONCLUÍDO" },
};

const flexibilityConfig: Record<
  PriorityFlexibility,
  { label: string; color: string }
> = {
  fixed: { label: "INADIÁVEL", color: "bg-red-500 text-white" },
  negotiable: { label: "NEGOCIÁVEL", color: "bg-yellow-400 text-black" },
  flexible: { label: "FLEXÍVEL", color: "bg-blue-500 text-white" },
};

export function PriorityCard({
  priority,
  okrs,
  onUpdate,
  onEdit,
  onDelete,
  color,
}: PriorityCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const status = statusConfig[priority.status];
  const StatusIcon = status.icon;
  const connectedOkr = okrs.find((okr) => okr.id === priority.okr_connection);
  const progress = milestonePercent(priority);
  const counts = milestoneCounts(priority);

  function advanceStatus() {
    const nextStatus: Record<PriorityStatus, PriorityStatus> = {
      not_started: "in_progress",
      in_progress: "completed",
      completed: "not_started",
    };
    onUpdate(priority.id, { status: nextStatus[priority.status] });
  }

  function toggleMilestone(id: string) {
    onUpdate(priority.id, {
      milestones: priority.milestones.map((milestone) =>
        milestone.id === id
          ? { ...milestone, completed: !milestone.completed }
          : milestone,
      ),
    });
  }

  const details = [
    { label: "CONTEXTO:", value: priority.context },
    { label: "CRITÉRIOS DE SUCESSO:", value: priority.success_criteria },
    { label: "RESULTADO ESPERADO:", value: priority.expected_outcome },
    { label: "OBSTÁCULOS:", value: priority.obstacles },
    { label: "RECURSOS NECESSÁRIOS:", value: priority.required_resources },
  ];

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", priority.id);
        event.dataTransfer.effectAllowed = "link";
      }}
      className="bg-white neo-brutal-border neo-brutal-shadow"
    >
      <div className={`${color} p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
            <span className="font-black text-black text-sm">{status.label}</span>
            {priority.flexibility && (
              <div className={`px-2 py-1 neo-brutal-border-thin text-xs ${flexibilityConfig[priority.flexibility].color}`}>
                <Shield className="w-3 h-3 inline mr-1" />
                {flexibilityConfig[priority.flexibility].label}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Editar prioridade"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(priority);
              }}
              className="bg-black text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <SquarePen className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Excluir prioridade"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteOpen(true);
              }}
              className="bg-red-600 text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="p-6 cursor-pointer"
        onClick={() => {
          setMilestonesOpen(true);
          setDetailsOpen(false);
        }}
      >
        <div className="space-y-4">
          <h3 className="text-xl font-black text-black leading-tight">{priority.title}</h3>
          {priority.description && (
            <p className="text-gray-700 font-medium">{priority.description}</p>
          )}
          {counts.total > 0 && (
            <div className="bg-gray-100 p-3 neo-brutal-border-thin">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-black">PROGRESSO DOS MARCOS</span>
                <span className="text-sm font-black text-black">{Math.round(progress)}%</span>
              </div>
              <div className="bg-gray-300 h-2 neo-brutal-border-thin mb-2">
                <div
                  className="bg-green-400 h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {counts.done}/{counts.total} marcos concluídos
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {priority.scope && (
              <div className={`px-2 py-1 neo-brutal-border-thin text-xs font-bold ${priority.scope === "team" ? "bg-orange-400" : "bg-purple-400"} text-black`}>
                <Users className="w-3 h-3 inline mr-1" />
                {priority.scope === "team" ? "EQUIPE" : "INDIVIDUAL"}
              </div>
            )}
            {priority.estimated_hours && (
              <div className="bg-gray-100 px-2 py-1 neo-brutal-border-thin text-xs font-bold">
                <Clock className="w-3 h-3 inline mr-1" />
                {priority.estimated_hours}h
              </div>
            )}
            {priority.deadline && (
              <div className="bg-gray-100 px-2 py-1 neo-brutal-border-thin text-xs font-bold">
                <Calendar className="w-3 h-3 inline mr-1" />
                {formatDayMonth(priority.deadline)}
              </div>
            )}
          </div>
          {connectedOkr && (
            <div className="bg-gray-100 p-3 neo-brutal-border-thin">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-600">CONECTADO AO OKR</span>
              </div>
              <p className="text-sm font-bold text-black">{connectedOkr.title}</p>
            </div>
          )}
        </div>
      </div>

      {milestonesOpen && counts.total > 0 && (
        <div className="border-t-4 border-black bg-yellow-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-black">MARCOS DA PRIORIDADE</h4>
            <button
              type="button"
              onClick={() => setMilestonesOpen(false)}
              className="text-sm font-bold text-gray-600 hover:text-black"
            >
              FECHAR
            </button>
          </div>
          <div className="space-y-2">
            {priority.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex items-center gap-3 p-3 neo-brutal-border-thin cursor-pointer ${milestone.completed ? "bg-green-100 text-gray-600 line-through" : "bg-white hover:bg-gray-50"}`}
                onClick={() => toggleMilestone(milestone.id)}
              >
                <div className={`w-4 h-4 neo-brutal-border-thin ${milestone.completed ? "bg-green-400" : "bg-white"}`}>
                  {milestone.completed && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="font-bold text-black">{milestone.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailsOpen && (
        <div className="border-t-4 border-black bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-black">DETALHES COMPLETOS</h4>
            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="text-sm font-bold text-gray-600 hover:text-black"
            >
              FECHAR
            </button>
          </div>
          <div className="space-y-4">
            {details.map(
              (detail) =>
                detail.value && (
                  <div key={detail.label}>
                    <h5 className="text-sm font-black text-black mb-1">{detail.label}</h5>
                    <p className="text-sm text-gray-700">{detail.value}</p>
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      <div className="p-4 border-t-4 border-black bg-gray-100">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={advanceStatus}
            className={`neo-brutal-button flex-1 py-2 ${color} text-black text-sm`}
          >
            {priority.status === "completed" ? "REABRIR" : "AVANÇAR STATUS"}
          </button>
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="neo-brutal-button px-4 py-2 bg-white text-black text-sm"
          >
            <Lightbulb className="w-4 h-4 inline mr-1" />
            DETALHES
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="EXCLUIR PRIORIDADE?"
        description={`Excluir “${priority.title}”? Esta ação será sincronizada com sua conta.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDelete(priority.id);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
