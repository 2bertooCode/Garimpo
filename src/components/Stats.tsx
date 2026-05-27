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
    <div className="flex flex-wrap gap-2.5 mb-6">
      <div className="spotify-stats-badge">
        <Clock size={14} className="text-purple-400" />
        <span>Poupou: <strong className="text-white">{timeSaved} min</strong></span>
      </div>
      <div className="spotify-stats-badge">
        <Eye size={14} className="text-cyan-400" />
        <span>Resumos: <strong className="text-white">{summariesCount}</strong></span>
      </div>
      <div className="spotify-stats-badge">
        <Youtube size={14} className="text-emerald-400" />
        <span>Canais: <strong className="text-white">{channelsCount}</strong></span>
      </div>
      <div className="spotify-stats-badge active">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span>Agendador: <strong className="text-white">{scheduleHour}</strong></span>
      </div>
    </div>
  );
};
