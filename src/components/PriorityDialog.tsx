import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  Calendar,
  Clock,
  FileText,
  Lightbulb,
  Link2,
  SquareCheck,
  Target,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { makeId } from "../store";
import type {
  ImpactLevel,
  Milestone,
  OKR,
  Priority,
  PriorityFlexibility,
  PriorityScope,
} from "../types";

export type PriorityDraft = Omit<
  Priority,
  "id" | "created_date" | "updated_date" | "week_start" | "status" | "position"
>;

type DialogTab = "basic" | "details" | "planning" | "milestones";

interface FormState {
  title: string;
  description: string;
  context: string;
  success_criteria: string;
  expected_outcome: string;
  obstacles: string;
  required_resources: string;
  stakeholders: string;
  deadline: string;
  estimated_hours: string;
  selectedOKR: string;
  impact_level: ImpactLevel;
  flexibility: PriorityFlexibility;
  scope: PriorityScope;
  milestones: Milestone[];
}

interface PriorityDialogProps {
  position: 1 | 2 | 3;
  okrs: OKR[];
  onSave: (draft: PriorityDraft) => void;
  onCancel: () => void;
  priorityToEdit: Priority | null;
  scope: PriorityScope;
}

function initialForm(scope: PriorityScope, priority: Priority | null): FormState {
  return {
    title: priority?.title ?? "",
    description: priority?.description ?? "",
    context: priority?.context ?? "",
    success_criteria: priority?.success_criteria ?? "",
    expected_outcome: priority?.expected_outcome ?? "",
    obstacles: priority?.obstacles ?? "",
    required_resources: priority?.required_resources ?? "",
    stakeholders: priority?.stakeholders ?? "",
    deadline: priority?.deadline?.split("T")[0] ?? "",
    estimated_hours: priority?.estimated_hours?.toString() ?? "",
    selectedOKR: priority?.okr_connection ?? "",
    impact_level: priority?.impact_level ?? "high",
    flexibility: priority?.flexibility ?? "fixed",
    scope: priority?.scope ?? scope,
    milestones: priority?.milestones.map((milestone) => ({ ...milestone })) ?? [],
  };
}

export function PriorityDialog({
  position,
  okrs,
  onSave,
  onCancel,
  priorityToEdit,
  scope,
}: PriorityDialogProps) {
  const [activeTab, setActiveTab] = useState<DialogTab>("basic");
  const [form, setForm] = useState<FormState>(() => initialForm(scope, priorityToEdit));
  const [milestoneTitle, setMilestoneTitle] = useState("");

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addMilestone() {
    const title = milestoneTitle.trim();
    if (!title) return;
    update("milestones", [
      ...form.milestones,
      { id: makeId("milestone"), title, completed: false },
    ]);
    setMilestoneTitle("");
  }

  function handleMilestoneKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addMilestone();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      context: form.context.trim(),
      success_criteria: form.success_criteria.trim(),
      expected_outcome: form.expected_outcome.trim(),
      obstacles: form.obstacles.trim(),
      required_resources: form.required_resources.trim(),
      stakeholders: form.stakeholders.trim(),
      deadline: form.deadline || undefined,
      estimated_hours: form.estimated_hours
        ? Number.parseFloat(form.estimated_hours)
        : undefined,
      okr_connection: form.selectedOKR || null,
      impact_level: form.impact_level,
      flexibility: form.flexibility,
      scope: form.scope,
      milestones: form.milestones,
    });
  }

  const tabs: { id: DialogTab; label: string; icon: typeof SquareCheck }[] = [
    { id: "basic", label: "ESSENCIAL", icon: SquareCheck },
    { id: "details", label: "DETALHES", icon: Lightbulb },
    { id: "planning", label: "PLANEJAMENTO", icon: Calendar },
    { id: "milestones", label: "MARCOS", icon: Target },
  ];
  const canSave = Boolean(
    form.title.trim() && form.description.trim() && form.success_criteria.trim(),
  );
  const impacts: { value: ImpactLevel; label: string; color: string }[] = [
    { value: "high", label: "ALTO", color: "bg-red-500" },
    { value: "medium", label: "MÉDIO", color: "bg-yellow-400" },
    { value: "low", label: "BAIXO", color: "bg-blue-500" },
  ];
  const scopes: { value: PriorityScope; label: string; color: string }[] = [
    { value: "individual", label: "INDIVIDUAL", color: "bg-purple-400" },
    { value: "team", label: "EQUIPE", color: "bg-orange-400" },
  ];
  const flexibilities: { value: PriorityFlexibility; label: string; color: string }[] = [
    { value: "fixed", label: "FIXO", color: "bg-red-500" },
    { value: "negotiable", label: "NEGOCIÁVEL", color: "bg-yellow-400" },
    { value: "flexible", label: "FLEXÍVEL", color: "bg-blue-500" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="bg-yellow-400 p-6 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-black">
              {priorityToEdit ? "EDITAR" : "NOVA"} PRIORIDADE #{position}
              {form.scope === "team" ? " (EQUIPE)" : " (INDIVIDUAL)"}
            </h2>
            <button
              type="button"
              aria-label="Fechar"
              onClick={onCancel}
              className="bg-black text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-gray-100 border-b-4 border-black">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 p-4 font-black text-sm flex items-center justify-center gap-2 border-r-2 border-black last:border-r-0 ${activeTab === tab.id ? "bg-white transform translate-y-1" : "hover:bg-gray-200"}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-black mb-2">TÍTULO DA PRIORIDADE *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  className="w-full p-4 neo-brutal-border text-lg font-bold bg-gray-50"
                  placeholder="Ex: Lançar a nova página de preços do produto X"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">DESCRIÇÃO DETALHADA *</label>
                <textarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  className="w-full p-4 neo-brutal-border h-32 bg-gray-50 resize-none"
                  placeholder="Ex: Finalizar o design da página, desenvolver o front-end, integrar com pagamentos e publicar."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">CONTEXTO E BACKGROUND</label>
                <textarea
                  value={form.context}
                  onChange={(event) => update("context", event.target.value)}
                  className="w-full p-4 neo-brutal-border h-24 bg-gray-50 resize-none"
                  placeholder="Ex: A página de preços atual é confusa e está causando quedas na conversão. É uma demanda crucial do time de Vendas para o Q3."
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">CRITÉRIOS DE SUCESSO *</label>
                <textarea
                  value={form.success_criteria}
                  onChange={(event) => update("success_criteria", event.target.value)}
                  className="w-full p-4 neo-brutal-border h-24 bg-gray-50 resize-none"
                  placeholder="Ex: A nova página está no ar, sem bugs críticos, e o fluxo de checkout funciona perfeitamente. Links de marketing estão direcionando para ela."
                  required
                />
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  <Target className="w-4 h-4 inline mr-1" />RESULTADO ESPERADO
                </label>
                <textarea
                  value={form.expected_outcome}
                  onChange={(event) => update("expected_outcome", event.target.value)}
                  className="w-full p-4 neo-brutal-border h-24 bg-gray-50 resize-none"
                  placeholder="Ex: Aumento de 10% na taxa de conversão da página e redução de 50% nos tickets de suporte relacionados a preços."
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  <TriangleAlert className="w-4 h-4 inline mr-1" />POSSÍVEIS OBSTÁCULOS
                </label>
                <textarea
                  value={form.obstacles}
                  onChange={(event) => update("obstacles", event.target.value)}
                  className="w-full p-4 neo-brutal-border h-24 bg-gray-50 resize-none"
                  placeholder="Ex: Atraso na entrega do design final; API de pagamento pode apresentar instabilidade."
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />RECURSOS NECESSÁRIOS
                </label>
                <textarea
                  value={form.required_resources}
                  onChange={(event) => update("required_resources", event.target.value)}
                  className="w-full p-4 neo-brutal-border h-24 bg-gray-50 resize-none"
                  placeholder="Ex: 1 Desenvolvedor Full-Stack (João), 1 Designer (Maria), acesso à conta do Stripe."
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  <Users className="w-4 h-4 inline mr-1" />STAKEHOLDERS ENVOLVIDOS
                </label>
                <input
                  type="text"
                  value={form.stakeholders}
                  onChange={(event) => update("stakeholders", event.target.value)}
                  className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
                  placeholder="Ex: Equipe de Marketing, Equipe de Vendas, C-Level."
                />
              </div>
            </div>
          )}

          {activeTab === "planning" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />PRAZO ESPECÍFICO (Dentro da semana)
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(event) => update("deadline", event.target.value)}
                    className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />HORAS ESTIMADAS
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimated_hours}
                    onChange={(event) => update("estimated_hours", event.target.value)}
                    className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
                    placeholder="EX: 8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  <Link2 className="w-4 h-4 inline mr-1" />CONECTAR COM OKR/META
                </label>
                <select
                  value={form.selectedOKR}
                  onChange={(event) => update("selectedOKR", event.target.value)}
                  className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
                >
                  <option value="">SELECIONE UM OKR (OPCIONAL)</option>
                  {okrs.map((okr) => (
                    <option key={okr.id} value={okr.id}>
                      {okr.title} - {okr.period.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">NÍVEL DE IMPACTO</label>
                <div className="grid grid-cols-3 gap-3">
                  {impacts.map((impact) => (
                    <button
                      type="button"
                      key={impact.value}
                      onClick={() => update("impact_level", impact.value)}
                      className={`neo-brutal-button py-3 text-black ${impact.color} ${form.impact_level === impact.value ? "transform translate-x-1 translate-y-1" : ""}`}
                    >
                      {impact.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  <Users className="w-4 h-4 inline mr-1" />ESCOPO DA PRIORIDADE
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {scopes.map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => update("scope", item.value)}
                      className={`neo-brutal-button py-3 text-black ${item.color} ${form.scope === item.value ? "transform translate-x-1 translate-y-1" : ""}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-2">BLINDAGEM (Nível de Flexibilidade)</label>
                <div className="grid grid-cols-3 gap-3">
                  {flexibilities.map((flexibility) => (
                    <button
                      type="button"
                      key={flexibility.value}
                      onClick={() => update("flexibility", flexibility.value)}
                      className={`neo-brutal-button py-3 text-black ${flexibility.color} ${form.flexibility === flexibility.value ? "transform translate-x-1 translate-y-1" : ""}`}
                    >
                      {flexibility.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {form.flexibility === "fixed" && "Esta prioridade não deve ser adiada."}
                  {form.flexibility === "negotiable" && "Esta prioridade pode ser reavaliada se necessário."}
                  {form.flexibility === "flexible" && "Esta prioridade pode ser adiada se surgirem outras mais urgentes."}
                </p>
              </div>
            </div>
          )}

          {activeTab === "milestones" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-black mb-2">ADICIONAR MARCO (MILESTONE)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={milestoneTitle}
                    onChange={(event) => setMilestoneTitle(event.target.value)}
                    onKeyDown={handleMilestoneKeyDown}
                    className="flex-1 p-4 neo-brutal-border bg-gray-50 font-bold"
                    placeholder="Ex: Aprovar o design final com a equipe"
                  />
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="neo-brutal-button bg-blue-400 text-black px-6 py-3"
                  >
                    ADICIONAR
                  </button>
                </div>
              </div>
              {form.milestones.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-md font-black text-black">MARCOS DEFINIDOS:</h3>
                  {form.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-100 neo-brutal-border-thin">
                      <span className="font-bold text-black">{milestone.title}</span>
                      <button
                        type="button"
                        aria-label={`Excluir marco ${milestone.title}`}
                        onClick={() => update("milestones", form.milestones.filter((item) => item.id !== milestone.id))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {form.milestones.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum marco adicionado ainda.</p>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-8 mt-6 border-t-4 border-black">
            <button
              type="button"
              onClick={onCancel}
              className="neo-brutal-button bg-gray-400 text-black px-6 py-3 flex-1"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={!priorityToEdit && !canSave}
              className={`neo-brutal-button px-6 py-3 flex-1 ${priorityToEdit || canSave ? "bg-green-400 text-black" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
            >
              SALVAR PRIORIDADE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
