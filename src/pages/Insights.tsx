import { useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCollection } from "../hooks";
import { formatDayMonth, formatFullDate } from "../utils/dates";
import { completionRate, okrPercent } from "../utils/progress";

type WeeklyRate = {
  week: string;
  total: number;
  completed: number;
};

export function Insights() {
  const priorities = useCollection("priorities");
  const okrs = useCollection("okrs");

  const weeklyData = useMemo(() => {
    const weeks = priorities.reduce<Record<string, WeeklyRate>>((result, priority) => {
      const week = result[priority.week_start] ?? {
        week: priority.week_start,
        total: 0,
        completed: 0,
      };
      week.total += 1;
      if (priority.status === "completed") week.completed += 1;
      result[priority.week_start] = week;
      return result;
    }, {});
    return Object.values(weeks)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((point) => ({
        week: formatDayMonth(point.week),
        taxa: point.total > 0 ? Math.round((point.completed / point.total) * 100) : 0,
        concluidas: point.completed,
        total: point.total,
      }));
  }, [priorities]);

  const sortedOkrs = useMemo(
    () => [...okrs].sort((a, b) => b.created_date.localeCompare(a.created_date)),
    [okrs],
  );
  const completed = priorities.filter((priority) => priority.status === "completed").length;
  const completedOkrs = okrs.filter((okr) => okrPercent(okr) >= 100).length;
  const inProgressOkrs = okrs.filter((okr) => {
    const progress = okrPercent(okr);
    return progress > 0 && progress < 100;
  }).length;
  const notStartedOkrs = okrs.filter((okr) => okrPercent(okr) === 0).length;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-black mb-2">INSIGHTS</h1>
        <p className="text-lg font-bold text-gray-600">
          VISUALIZE SEU DESEMPENHO E STATUS DOS OBJETIVOS
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 neo-brutal-border neo-brutal-shadow p-4 md:p-6 text-center">
          <Target className="w-8 h-8 text-white mx-auto mb-2" />
          <p className="text-3xl font-black text-white">{priorities.length}</p>
          <p className="text-xs font-bold text-white">PRIORIDADES TOTAIS</p>
        </div>
        <div className="bg-green-400 neo-brutal-border neo-brutal-shadow p-4 md:p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-black mx-auto mb-2" />
          <p className="text-3xl font-black text-black">{completed}</p>
          <p className="text-xs font-bold text-black">CONCLUÍDAS</p>
        </div>
        <div className="bg-purple-500 neo-brutal-border neo-brutal-shadow p-4 md:p-6 text-center">
          <TrendingUp className="w-8 h-8 text-white mx-auto mb-2" />
          <p className="text-3xl font-black text-white">{completionRate(priorities)}%</p>
          <p className="text-xs font-bold text-white">TAXA GERAL</p>
        </div>
        <div className="bg-yellow-400 neo-brutal-border neo-brutal-shadow p-4 md:p-6 text-center">
          <Target className="w-8 h-8 text-black mx-auto mb-2" />
          <p className="text-3xl font-black text-black">{okrs.length}</p>
          <p className="text-xs font-bold text-black">OKRS ATIVOS</p>
        </div>
      </div>

      <div className="bg-white neo-brutal-border neo-brutal-shadow mb-8">
        <div className="p-4 bg-black border-b-2 border-black">
          <h2 className="font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            TAXA DE CONCLUSÃO NAS ÚLTIMAS SEMANAS
          </h2>
        </div>
        <div className="p-4 md:p-6">
          {weeklyData.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-bold">Nenhuma prioridade registrada ainda.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTaxa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fontWeight: 700 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    border: "2px solid #000",
                    boxShadow: "4px 4px 0px #000",
                    fontWeight: 700,
                  }}
                  formatter={(value) => [`${value}%`, "Taxa de Conclusão"]}
                />
                <Area
                  type="monotone"
                  dataKey="taxa"
                  stroke="#16a34a"
                  strokeWidth={3}
                  fill="url(#colorTaxa)"
                  dot={{ fill: "#16a34a", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white neo-brutal-border neo-brutal-shadow">
        <div className="p-4 bg-black border-b-2 border-black">
          <h2 className="font-black text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            STATUS ATUAL DOS OKRS
          </h2>
        </div>
        <div className="p-4 md:p-6">
          {okrs.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-bold">Nenhum OKR definido ainda.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-100 neo-brutal-border-thin p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-black text-green-600">{completedOkrs}</p>
                  <p className="text-xs font-bold text-gray-600">CONCLUÍDOS</p>
                </div>
                <div className="bg-yellow-100 neo-brutal-border-thin p-4 text-center">
                  <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-2xl font-black text-yellow-600">{inProgressOkrs}</p>
                  <p className="text-xs font-bold text-gray-600">EM PROGRESSO</p>
                </div>
                <div className="bg-red-100 neo-brutal-border-thin p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-black text-red-600">{notStartedOkrs}</p>
                  <p className="text-xs font-bold text-gray-600">NÃO INICIADOS</p>
                </div>
              </div>
              <div className="space-y-4">
                {sortedOkrs.map((okr) => {
                  const progress = okrPercent(okr);
                  const color =
                    progress >= 100
                      ? "bg-green-400"
                      : progress >= 50
                        ? "bg-yellow-400"
                        : "bg-red-400";
                  const status =
                    progress >= 100 ? "CONCLUÍDO" : progress >= 50 ? "NO PRAZO" : "ATRASADO";
                  const keyResults = okr.key_results ?? [];
                  const completedKeyResults = keyResults.filter((keyResult) => keyResult.completed).length;
                  return (
                    <div key={okr.id} className="p-4 bg-gray-50 neo-brutal-border-thin">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-black text-sm md:text-base truncate">
                            {okr.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-500">
                            <span className="px-2 py-1 bg-black text-white">
                              {okr.period.toUpperCase()}
                            </span>
                            {okr.target_date && <span>ALVO: {formatFullDate(okr.target_date)}</span>}
                            <span>
                              KRs: {completedKeyResults}/{keyResults.length}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-black text-black ${color} neo-brutal-border-thin flex-shrink-0`}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-5 bg-gray-300 neo-brutal-border-thin overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${color}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-lg font-black text-black w-12 text-right">
                          {progress}%
                        </span>
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
