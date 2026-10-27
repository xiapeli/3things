import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus, Tag, X } from "lucide-react";
import type {
  BacklogCategory,
  BacklogEffort,
  BacklogItem,
  BacklogPriorityLevel,
  BacklogStatus,
} from "../types";

type IdeaFormData = Omit<BacklogItem, "id" | "created_date" | "updated_date">;

interface IdeaDialogProps {
  item: BacklogItem | null;
  categories: { value: BacklogCategory; label: string }[];
  priorityLevels: { value: BacklogPriorityLevel; label: string }[];
  onSave: (item: IdeaFormData) => void;
  onCancel: () => void;
}

const EFFORTS: { value: BacklogEffort; label: string }[] = [
  { value: "unknown", label: "NÃO SEI" },
  { value: "small", label: "PEQUENO" },
  { value: "medium", label: "MÉDIO" },
  { value: "large", label: "GRANDE" },
];

const STATUSES: { value: BacklogStatus; label: string }[] = [
  { value: "captured", label: "CAPTURADA" },
  { value: "reviewing", label: "ANALISANDO" },
  { value: "approved", label: "APROVADA" },
  { value: "discarded", label: "DESCARTADA" },
];

export function IdeaDialog({
  item,
  categories,
  priorityLevels,
  onSave,
  onCancel,
}: IdeaDialogProps) {
  const [form, setForm] = useState<IdeaFormData>({
    title: item?.title || "",
    description: item?.description || "",
    category: item?.category || "idea",
    priority_level: item?.priority_level || "someday",
    tags: item?.tags || [],
    estimated_effort: item?.estimated_effort || "unknown",
    source: item?.source || "",
    status: item?.status || "captured",
  });
  const [newTag, setNewTag] = useState("");

  const updateField = <K extends keyof IdeaFormData>(field: K, value: IdeaFormData[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((current) => ({ ...current, tags: [...current.tags, tag] }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.filter((currentTag) => currentTag !== tag),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description?.trim(),
      source: form.source?.trim(),
    });
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white neo-brutal-border neo-brutal-shadow max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="bg-yellow-400 p-6 neo-brutal-border-thin border-l-0 border-r-0 border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-black">
              {item ? "EDITAR IDEIA" : "NOVA IDEIA"}
            </h2>
            <button
              onClick={onCancel}
              className="bg-black text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-black text-black mb-2">TÍTULO DA IDEIA *</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full p-4 neo-brutal-border text-lg font-bold bg-gray-50"
              placeholder="Ex: Implementar sistema de notificações push"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2">DESCRIÇÃO DETALHADA</label>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="w-full p-4 neo-brutal-border h-32 bg-gray-50 resize-none"
              placeholder="Detalhe sua ideia, contexto, benefícios esperados..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-black mb-2">CATEGORIA</label>
              <select
                value={form.category}
                onChange={(event) => updateField("category", event.target.value as BacklogCategory)}
                className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-2">PRIORIDADE</label>
              <select
                value={form.priority_level}
                onChange={(event) =>
                  updateField("priority_level", event.target.value as BacklogPriorityLevel)
                }
                className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
              >
                {priorityLevels.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-black mb-2">ESFORÇO ESTIMADO</label>
              <select
                value={form.estimated_effort}
                onChange={(event) => updateField("estimated_effort", event.target.value as BacklogEffort)}
                className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
              >
                {EFFORTS.map((effort) => (
                  <option key={effort.value} value={effort.value}>
                    {effort.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-2">STATUS</label>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value as BacklogStatus)}
                className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2">ORIGEM DA IDEIA</label>
            <input
              type="text"
              value={form.source}
              onChange={(event) => updateField("source", event.target.value)}
              className="w-full p-4 neo-brutal-border bg-gray-50 font-bold"
              placeholder="Ex: Reunião com cliente, brainstorm, feedback..."
            />
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2">TAGS PARA ORGANIZAÇÃO</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                className="flex-1 p-3 neo-brutal-border bg-gray-50 font-bold"
                placeholder="Digite uma tag..."
                onKeyDown={handleTagKeyDown}
              />
              <button
                type="button"
                onClick={addTag}
                className="neo-brutal-button bg-blue-400 text-black px-4 py-3"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 neo-brutal-border-thin"
                  >
                    <Tag className="w-3 h-3" />
                    <span className="font-bold text-sm">#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={!form.title.trim()}
              className={`neo-brutal-button px-6 py-3 flex-1 ${
                form.title.trim()
                  ? "bg-green-400 text-black"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {item ? "SALVAR ALTERAÇÕES" : "SALVAR IDEIA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
