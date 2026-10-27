import { useState } from "react";
import { Calendar, Plus, Target, TrendingUp } from "lucide-react";
import { OkrCard } from "../components/OkrCard";
import { OkrDialog } from "../components/OkrDialog";
import type { OkrFormData } from "../components/OkrDialog";
import { useCollection } from "../hooks";
import { store } from "../store";
import type { OKR } from "../types";

export function OKRs() {
  const okrs = useCollection("okrs");
  const [showDialog, setShowDialog] = useState(false);
  const [okrToEdit, setOkrToEdit] = useState<OKR | null>(null);

  const closeDialog = () => {
    setShowDialog(false);
    setOkrToEdit(null);
  };

  const openEditDialog = (okr: OKR) => {
    setOkrToEdit(okr);
    setShowDialog(true);
  };

  const handleSave = (data: OkrFormData) => {
    if (okrToEdit) {
      store.update("okrs", okrToEdit.id, data);
    } else {
      store.create("okrs", data);
    }
    closeDialog();
  };

  const handleUpdate = (id: string, patch: Partial<OKR>) => {
    store.update("okrs", id, patch);
  };

  const handleDelete = (id: string) => {
    store.remove("okrs", id);
  };

  const sortedOkrs = [...okrs].sort(
    (a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime(),
  );
  const monthly = okrs.filter((okr) => okr.period === "monthly").length;
  const quarterly = okrs.filter((okr) => okr.period === "quarterly").length;
  const annual = okrs.filter((okr) => okr.period === "annual").length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-black mb-2 transform rotate-1">
              OKRS &amp; METAS
            </h1>
            <p className="text-lg font-bold text-gray-600">
              DEFINA SEUS OBJETIVOS E RESULTADOS-CHAVE
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="neo-brutal-button bg-yellow-400 text-black px-6 py-3"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            NOVO OKR
          </button>
        </div>
      </div>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{okrs.length}</p>
              <p className="text-sm font-bold text-white">TOTAL OKRS</p>
            </div>
          </div>
        </div>
        <div className="bg-green-400 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-black" />
            <div>
              <p className="text-2xl font-black text-black">{monthly}</p>
              <p className="text-sm font-bold text-black">MENSAIS</p>
            </div>
          </div>
        </div>
        <div className="bg-red-500 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{quarterly}</p>
              <p className="text-sm font-bold text-white">TRIMESTRAIS</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500 neo-brutal-border neo-brutal-shadow p-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{annual}</p>
              <p className="text-sm font-bold text-white">ANUAIS</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedOkrs.map((okr) => (
          <OkrCard
            key={okr.id}
            okr={okr}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onEdit={() => openEditDialog(okr)}
          />
        ))}
      </div>
      {okrs.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-24 h-24 mx-auto text-gray-400 mb-4" />
          <h3 className="text-2xl font-black text-gray-600 mb-2">NENHUM OKR DEFINIDO</h3>
          <p className="text-gray-500 mb-6">
            Comece criando seus primeiros objetivos e resultados-chave
          </p>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="neo-brutal-button bg-yellow-400 text-black px-8 py-3"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            CRIAR PRIMEIRO OKR
          </button>
        </div>
      )}
      {showDialog && (
        <OkrDialog okr={okrToEdit ?? undefined} onSave={handleSave} onCancel={closeDialog} />
      )}
    </div>
  );
}
