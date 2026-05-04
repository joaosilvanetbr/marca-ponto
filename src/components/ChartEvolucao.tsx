import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEvolucaoAnual } from '@/hooks/useEvolucaoAnual';
import { paraHora } from '@/lib/time-utils';

interface ChartEvolucaoProps {
  userId: string | null;
  jornada: string;
  tolerancia: number;
  saldoInicial: number;
}

export default function ChartEvolucao({ userId, jornada, tolerancia, saldoInicial }: ChartEvolucaoProps) {
  const [ano, setAno] = useState(new Date().getFullYear());
  const { data = [], isLoading } = useEvolucaoAnual(userId, ano, jornada, tolerancia, saldoInicial);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="ios-card rounded-2xl p-5 shadow-xl space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          Evolução do banco de horas
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAno((a) => a - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-12 text-center">{ano}</span>
          <button
            onClick={() => setAno((a) => a + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Nenhum dado</div>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  tickFormatter={(v: number) => paraHora(v)}
                />
                <Tooltip
                  formatter={(value) => [paraHora(Number(value) || 0), 'Acumulado']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAcumulado)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Inicial</div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{saldoInicial >= 0 ? '+' : ''}{paraHora(saldoInicial)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Variação ano</div>
              <div className={`text-sm font-bold ${data[data.length - 1]?.acumulado - saldoInicial >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data[data.length - 1]?.acumulado - saldoInicial >= 0 ? '+' : ''}{paraHora(data[data.length - 1]?.acumulado - saldoInicial || 0)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Acumulado</div>
              <div className={`text-sm font-bold ${data[data.length - 1]?.acumulado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data[data.length - 1]?.acumulado >= 0 ? '+' : ''}{paraHora(data[data.length - 1]?.acumulado || 0)}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
