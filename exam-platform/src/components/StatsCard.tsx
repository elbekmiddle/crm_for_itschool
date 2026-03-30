import React from 'react';
import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card p-6 flex items-center gap-4">
    <div className={cn("p-3 rounded-2xl shrink-0", color)}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <div className="label-subtle">{label}</div>
      <div className="text-2xl font-black text-slate-800 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-400 font-medium">{sub}</div>}
    </div>
  </div>
);

export default StatsCard;
