import React from 'react';
import { Eye, Youtube, Clock, ShieldCheck } from 'lucide-react';

interface StatsProps {
  channelsCount: number;
  summariesCount: number;
  timeSaved: number;
  scheduleHour: string;
}

export const Stats: React.FC<StatsProps> = ({
  channelsCount,
  summariesCount,
  timeSaved,
  scheduleHour
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Time Saved Stat */}
      <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between relative overflow-hidden">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Tempo Economizado
          </span>
          <h3 className="text-3xl font-extrabold text-gradient-purple">
            {timeSaved} <span className="text-lg font-medium text-slate-400">min</span>
          </h3>
        </div>
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
          <Clock size={24} />
        </div>
        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"></div>
      </div>

      {/* Briefings count */}
      <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between relative overflow-hidden">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Resumos Gerados
          </span>
          <h3 className="text-3xl font-extrabold text-gradient-cyan">
            {summariesCount}
          </h3>
        </div>
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">
          <Eye size={24} />
        </div>
        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
      </div>

      {/* Monitored channels */}
      <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between relative overflow-hidden">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Canais Monitorados
          </span>
          <h3 className="text-3xl font-extrabold text-emerald-400">
            {channelsCount}
          </h3>
        </div>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
          <Youtube size={24} />
        </div>
        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
      </div>

      {/* Scheduler status */}
      <div className="glass-panel glass-panel-hover p-5 flex items-center justify-between relative overflow-hidden">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Agente Matinal
          </span>
          <div className="flex items-center gap-2">
            <span className="pulse-indicator"></span>
            <span className="font-bold text-slate-200">Ativo</span>
          </div>
          <span className="text-xs text-slate-400 block mt-1">
            Cron diário às <span className="font-semibold text-slate-200">{scheduleHour}</span>
          </span>
        </div>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
          <ShieldCheck size={24} />
        </div>
        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
      </div>
    </div>
  );
};
