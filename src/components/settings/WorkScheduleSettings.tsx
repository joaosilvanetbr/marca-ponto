import { Briefcase, CalendarDays } from 'lucide-react';

interface WorkScheduleSettingsProps {
  jornada: string;
  diasTrabalho: number[];
  onJornadaChange: (v: string) => void;
  onToggleDiaTrabalho: (dia: number) => void;
}

export function WorkScheduleSettings({
  jornada,
  diasTrabalho,
  onJornadaChange,
  onToggleDiaTrabalho
}: WorkScheduleSettingsProps) {
  return (
    <div className="space-y-5">
      {/* Jornada */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Jornada diaria</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Horas esperadas por dia</div>
          </div>
        </div>
        <input
          type="time"
          value={jornada}
          onChange={(e) => onJornadaChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
        />
      </div>

      {/* Dias de Trabalho */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Dias de trabalho</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Selecione os dias da sua escala</div>
          </div>
        </div>
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 mt-3">
          {[{ n: 0, l: 'D' }, { n: 1, l: 'S' }, { n: 2, l: 'T' }, { n: 3, l: 'Q' }, { n: 4, l: 'Q' }, { n: 5, l: 'S' }, { n: 6, l: 'S' }].map((dia) => {
            const ativo = diasTrabalho.includes(dia.n);
            return (
              <button
                key={dia.n}
                onClick={() => onToggleDiaTrabalho(dia.n)}
                className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${ativo ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {dia.l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
