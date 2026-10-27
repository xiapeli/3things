import { useMemo } from "react";
import { BarChart3, CheckCircle2, Clock, Target, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCollection } from "../hooks";
import { formatDayMonth, formatFullDate } from "../utils/dates";
import { okrPercent, weekStats } from "../utils/progress";

type WeeklyPoint = {
  week: string;
  Concluídas: number;
  "Em Progresso": number;
  "Não Iniciadas": number;
};

export function Stats() {
  const priorities = useCollection("priorities");
  const okrs = useCollection("okrs");
  const stats = weekStats(priorities);

  const weeklyData = useMemo(() => {
    const weeks = priorities.reduce<Record<string, WeeklyPoint>>((result, priority) => {
      const week = result[priority.week_start] ?? {
        week: priority.week_start,
        Concluídas: 0,
        "Em Progresso": 0,
        "Não Iniciadas": 0,
      };
      if (priority.status === "completed") week.Concluídas += 1;
      else if (priority.status === "in_progress") week["Em Progresso"] += 1;
      else week["Não Iniciadas"] += 1;
      result[priority.week_start] = week;
      return result;
    }, {});
    return Object.values(weeks)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((point) => ({ ...point, weekLabel: formatDayMonth(point.week) }));
  }, [priorities]);

  const sortedOkrs = useMemo(
    () => [...okrs].sort((a, b) => b.created_date.localeCompare(a.created_date)),
    [okrs],
  );
  const averageProgress =
    okrs.length > 0
      ? Math.round(okrs.reduce((sum, okr) => sum + okrPercent(okr), 0) / okrs.length)
      : 0;
  const completedOkrs = okrs.filter((okr) => okrPercent(okr) >= 100).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl md:text-6xl font-black text-black mb-2 transform -rotate-1">
          ESTATÍSTICAS
        </h1>
        <p className="text-lg font-bold text-gray-600">ACOMPANHE SEU DESEMPENHO E PROGRESSO</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 neo-brutal-border neo-brutal-shadow p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Target className="w-7 h-7 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{stats.total}</p>
              <p className="text-xs md:text-sm font-bold text-white">TOTAL PRIORIDADES</p>
            </div>
          </div>
        </div>
        <div className="bg-green-400 neo-brutal-border neo-brutal-shadow p-4 md:p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-black" />
            <div>
              <p className="text-2xl font-black text-black">{stats.completed}</p>
              <p className="text-xs md:text-sm font-bold text-black">CONCLUÍDAS</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-400 neo-brutal-border neo-brutal-shadow p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-7 h-7 text-black" />
            <div>
              <p className="text-2xl font-black text-black">{stats.inProgress}</p>
              <p className="text-xs md:text-sm font-bold text-black">EM PROGRESSO</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500 neo-brutal-border neo-brutal-shadow p-4 md:p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-white" />
            <div>
              <p className="text-2xl font-black text-white">{stats.percent}%</p>
              <p className="text-xs md:text-sm font-bold text-white">TAXA DE SUCESSO</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white neo-brutal-border neo-brutal-shadow mb-8">
        <div className="p-4 bg-black border-b-2 border-black">
          <h2 className="font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            HISTÓRICO DE CONCLUSÃO SEMANAL
          </h2>
        </div>
        <div className="p-4 md:p-6">
          {weeklyData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 font-bold">Nenhuma prioridade registrada ainda.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={weeklyData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{
                    border: "2px solid #000",
                    boxShadow: "4px 4px 0px #000",
                    fontWeight: 700,
                  }}
                />
                <Legend wrapperStyle={{ fontWeight: 700 }} />
                <Bar dataKey="Concluídas" fill="#4ade80" stackId="a" />
                <Bar dataKey="Em Progresso" fill="#facc15" stackId="a" />
                <Bar dataKey="Não Iniciadas" fill="#d1d5db" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white neo-brutal-border neo-brutal-shadow">
        <div className="p-4 bg-black border-b-2 border-black">
          <h2 className="font-black text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            PROGRESSO DOS OKRS
          </h2>
        </div>
        <div className="p-4 md:p-6">
          {okrs.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-bold">Nenhum OKR definido ainda.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 neo-brutal-border-thin p-4 text-center">
                  <p className="text-3xl font-black text-black">{okrs.length}</p>
                  <p className="text-xs font-bold text-gray-600">TOTAL OKRS</p>
                </div>
                <div className="bg-green-100 neo-brutal-border-thin p-4 text-center">
                  <p className="text-3xl font-black text-green-600">{completedOkrs}</p>
                  <p className="text-xs font-bold text-gray-600">CONCLUÍDOS</p>
                </div>
                <div className="bg-purple-100 neo-brutal-border-thin p-4 text-center">
                  <p className="text-3xl font-black text-purple-600">{averageProgress}%</p>
                  <p className="text-xs font-bold text-gray-600">PROGRESSO MÉDIO</p>
                </div>
              </div>
              <div className="space-y-4">
                {sortedOkrs.map((okr) => {
                  const progress = okrPercent(okr);
                  return (
                    <div key={okr.id} className="p-4 bg-gray-50 neo-brutal-border-thin">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-black text-black text-sm md:text-base truncate pr-2">
                          {okr.title}
                        </p>
                        <span className="text-sm font-black text-black flex-shrink-0">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-4 bg-gray-300 neo-brutal-border-thin overflow-hidden">
                        <div
                          className="h-full bg-green-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-500">
                        <span>PERÍODO: {okr.period.toUpperCase()}</span>
                        {okr.target_date && <span>ALVO: {formatFullDate(okr.target_date)}</span>}
                        <span>KRs: {(okr.key_results ?? []).length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
