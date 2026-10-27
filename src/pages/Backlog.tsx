import { useMemo, useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  ArrowUp,
  Edit,
  Lightbulb,
  MoreVertical,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { IdeaDialog } from "../components/IdeaDialog";
import { PromoteIdeaDialog } from "../components/PromoteIdeaDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useCollection } from "../hooks";
import { store } from "../store";
import type {
  BacklogCategory,
  BacklogEffort,
  BacklogItem,
  BacklogPriorityLevel,
  BacklogStatus,
} from "../types";

interface Category {
  value: BacklogCategory;
  label: string;
  color: string;
  icon: LucideIcon;
}

interface PriorityLevel {
  value: BacklogPriorityLevel;
  label: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { value: "idea", label: "IDEIA", color: "bg-yellow-400", icon: Lightbulb },
  { value: "task", label: "TAREFA", color: "bg-blue-500", icon: Plus },
  { value: "improvement", label: "MELHORIA", color: "bg-green-400", icon: ArrowUp },
  { value: "bug", label: "PROBLEMA", color: "bg-red-500", icon: AlertTriangle },
  { value: "feature", label: "FUNCIONALIDADE", color: "bg-purple-500", icon: Star },
  { value: "meeting", label: "REUNIÃO", color: "bg-orange-400", icon: Users },
  { value: "research", label: "PESQUISA", color: "bg-indigo-500", icon: Search },
  { value: "other", label: "OUTROS", color: "bg-gray-400", icon: Tag },
];

const PRIORITY_LEVELS: PriorityLevel[] = [
  { value: "urgent", label: "URGENTE", color: "bg-red-500" },
  { value: "this_month", label: "ESTE MÊS", color: "bg-orange-400" },
  { value: "next_month", label: "PRÓX. MÊS", color: "bg-blue-400" },
  { value: "someday", label: "ALGUM DIA", color: "bg-gray-400" },
];

const STATUS_COLORS: Record<BacklogStatus, string> = {
  captured: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  promoted: "bg-purple-100 text-purple-800",
  discarded: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<BacklogStatus, string> = {
  captured: "CAPTURADA",
  reviewing: "ANALISANDO",
  approved: "APROVADA",
  promoted: "PROMOVIDA",
  discarded: "DESCARTADA",
};

const EFFORTS: Record<BacklogEffort, { label: string; color: string }> = {
  small: { label: "PEQUENO", color: "bg-green-200 text-green-800" },
  medium: { label: "MÉDIO", color: "bg-yellow-200 text-yellow-800" },
  large: { label: "GRANDE", color: "bg-red-200 text-red-800" },
  unknown: { label: "?", color: "bg-gray-200 text-gray-800" },
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR");

function formatDate(date: string) {
  return DATE_FORMATTER.format(new Date(date));
}

interface BacklogCardProps {
  item: BacklogItem;
  onDelete: (id: string) => void;
  onPromote: (item: BacklogItem) => void;
  onEdit: (item: BacklogItem) => void;
}

function BacklogCard({ item, onDelete, onPromote, onEdit }: BacklogCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const category = CATEGORIES.find((current) => current.value === item.category);
  const priority = PRIORITY_LEVELS.find((current) => current.value === item.priority_level);
  const CategoryIcon = category?.icon || Tag;

  return (
    <div className="bg-white neo-brutal-border neo-brutal-shadow relative">
      <div
        className={`${category?.color || "bg-gray-400"} p-4 neo-brutal-border-thin border-l-0 border-r-0 border-t-0`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIcon className="w-5 h-5 text-black" />
            <span className="font-black text-black text-sm">{category?.label || "OUTROS"}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-black text-white p-2 neo-brutal-border-thin transform hover:rotate-6 transition-transform"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 bg-white neo-brutal-border neo-brutal-shadow z-10 min-w-48">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(item);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-100 font-bold flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  EDITAR
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onPromote(item);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-100 font-bold flex items-center gap-2"
                  disabled={item.promoted_to_priority}
                >
                  <ArrowUp className="w-4 h-4" />
                  {item.promoted_to_priority ? "JÁ PROMOVIDA" : "PROMOVER"}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="w-full text-left p-3 hover:bg-red-100 font-bold text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  DELETAR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black text-black mb-3 leading-tight">{item.title}</h3>
        {item.description && <p className="text-gray-700 font-medium mb-4">{item.description}</p>}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 neo-brutal-border-thin text-xs font-bold text-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          <div
            className={`px-3 py-1 neo-brutal-border-thin text-xs font-bold ${STATUS_COLORS[item.status]}`}
          >
            {STATUS_LABELS[item.status]}
          </div>
          <div
            className={`px-3 py-1 neo-brutal-border-thin text-xs font-bold ${priority?.color} text-white`}
          >
            {priority?.label}
          </div>
          {item.estimated_effort && (
            <div
              className={`px-3 py-1 neo-brutal-border-thin text-xs font-bold ${EFFORTS[item.estimated_effort]?.color}`}
            >
              {EFFORTS[item.estimated_effort]?.label}
            </div>
          )}
        </div>
        {item.source && (
          <p className="text-sm text-gray-500 mb-2">
            <strong>Origem:</strong> {item.source}
          </p>
        )}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          <p>Criado em {formatDate(item.created_date)}</p>
          {item.promoted_to_priority && item.promoted_date && (
            <p className="text-purple-600 font-bold">Promovida em {formatDate(item.promoted_date)}</p>
          )}
        </div>
      </div>
      {menuOpen && <div className="fixed inset-0 z-5" onClick={() => setMenuOpen(false)} />}
      <ConfirmDialog
        open={deleteOpen}
        title="DELETAR IDEIA?"
        description={`Deletar “${item.title}” do backlog? Esta ação será sincronizada com sua conta.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDelete(item.id);
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}

export function Backlog() {
  const items = useCollection("backlogItems");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BacklogItem | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return [...items]
      .sort((a, b) => b.created_date.localeCompare(a.created_date))
      .filter((item) => {
        if (
          search.trim() &&
          !item.title.toLowerCase().includes(normalizedSearch) &&
          !item.description?.toLowerCase().includes(normalizedSearch) &&
          !item.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch))
        ) {
          return false;
        }
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (priorityFilter !== "all" && item.priority_level !== priorityFilter) return false;
        return true;
      });
  }, [items, search, categoryFilter, priorityFilter]);

  const stats = {
    total: items.length,
    captured: items.filter((item) => item.status === "captured").length,
    promoted: items.filter((item) => item.promoted_to_priority).length,
    urgent: items.filter((item) => item.priority_level === "urgent").length,
  };

  const closeDialogs = () => {
    setDialogOpen(false);
    setPromoteDialogOpen(false);
    setSelectedItem(null);
  };

  const saveIdea = (form: Omit<BacklogItem, "id" | "created_date" | "updated_date">) => {
    if (selectedItem) {
      store.update("backlogItems", selectedItem.id, form);
    } else {
      store.create("backlogItems", form);
    }
    closeDialogs();
  };

  const captureIdea = () => {
    if (!quickTitle.trim()) return;
    store.create("backlogItems", {
      title: quickTitle.trim(),
      category: "idea",
      priority_level: "someday",
      tags: [],
      estimated_effort: "unknown",
      status: "captured",
    });
    setQuickTitle("");
  };

  const handleQuickCaptureKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") captureIdea();
  };

  const promoteIdea = ({ notes }: { weekStart: string; notes: string }) => {
    if (!selectedItem) return;
    store.update("backlogItems", selectedItem.id, {
      status: "promoted",
      promoted_to_priority: true,
      promoted_date: new Date().toISOString().split("T")[0],
      review_notes: notes,
    });
    closeDialogs();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-black mb-2 transform rotate-1">
              CENTRAL DE BACKLOG
            </h1>
            <p className="text-lg font-bold text-gray-600">
              CAPTURE IDEIAS SEM PERDER O FOCO DAS 3 PRIORIDADES
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="neo-brutal-button bg-yellow-400 text-black px-6 py-3"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            NOVA IDEIA
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-white neo-brutal-border neo-brutal-shadow p-4">
          <h3 className="text-lg font-black text-black mb-3">CAPTURA RÁPIDA</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite uma ideia rapidamente e pressione Enter..."
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
              className="flex-1 p-3 neo-brutal-border bg-gray-50 font-bold"
              onKeyDown={handleQuickCaptureKeyDown}
            />
            <button
              onClick={captureIdea}
              className="neo-brutal-button bg-green-400 text-black px-4 py-3"
            >
              CAPTURAR
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{stats.total}</p>
              <p className="text-sm font-bold text-white">TOTAL DE IDEIAS</p>
            </div>
          </div>
        </div>
        <div className="bg-green-400 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-black" />
            <div>
              <p className="text-2xl font-black text-black">{stats.captured}</p>
              <p className="text-sm font-bold text-black">CAPTURADAS</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <ArrowUp className="w-8 h-8 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{stats.promoted}</p>
              <p className="text-sm font-bold text-white">PROMOVIDAS</p>
            </div>
          </div>
        </div>
        <div className="bg-red-500 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{stats.urgent}</p>
              <p className="text-sm font-bold text-white">URGENTES</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white neo-brutal-border neo-brutal-shadow p-4 mb-8">
        <div className="space-y-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, descrição ou tags..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-10 pr-4 py-3 neo-brutal-border bg-gray-50 font-bold"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-black mb-2">CATEGORIA</label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full p-3 neo-brutal-border bg-gray-50 font-bold"
              >
                <option value="all">TODAS CATEGORIAS</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-2">PRIORIDADE</label>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="w-full p-3 neo-brutal-border bg-gray-50 font-bold"
              >
                <option value="all">TODAS PRIORIDADES</option>
                {PRIORITY_LEVELS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <BacklogCard
            key={item.id}
            item={item}
            onDelete={(id) => store.remove("backlogItems", id)}
            onPromote={(selected) => {
              setSelectedItem(selected);
              setPromoteDialogOpen(true);
            }}
            onEdit={(selected) => {
              setSelectedItem(selected);
              setDialogOpen(true);
            }}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb className="w-24 h-24 mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-black text-gray-600 mb-2">
            {search || categoryFilter !== "all" || priorityFilter !== "all"
              ? "NENHUM ITEM ENCONTRADO"
              : "NENHUMA IDEIA CAPTURADA"}
          </h3>
          <p className="text-gray-500 mb-6">
            {search || categoryFilter !== "all" || priorityFilter !== "all"
              ? "Tente ajustar os filtros para encontrar o que procura"
              : "Comece capturando suas primeiras ideias e anotações"}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="neo-brutal-button bg-yellow-400 text-black px-8 py-3"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            CAPTURAR PRIMEIRA IDEIA
          </button>
        </div>
      )}

      {dialogOpen && (
        <IdeaDialog
          item={selectedItem}
          categories={CATEGORIES}
          priorityLevels={PRIORITY_LEVELS}
          onSave={saveIdea}
          onCancel={closeDialogs}
        />
      )}
      {promoteDialogOpen && selectedItem && (
        <PromoteIdeaDialog
          item={selectedItem}
          onConfirm={promoteIdea}
          onCancel={closeDialogs}
        />
      )}
    </div>
  );
}
