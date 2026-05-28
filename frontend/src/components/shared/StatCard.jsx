import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { cn } from '@/lib/utils';

const colorMap = {
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    border: 'border-l-blue-500',
  },
  green: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    border: 'border-l-emerald-500',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    border: 'border-l-amber-500',
  },
  red: {
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    border: 'border-l-rose-500',
  },
};

function StatCard({ title, value, icon: Icon, trend, color = 'blue' }) {
  const colors = colorMap[color] || colorMap.blue;
  const isPositive = trend && !trend.startsWith('-');

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-all duration-200 hover:shadow-md border-l-4',
        colors.border
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {value}
          </div>
          {trend ? (
            <div
              className={cn(
                'text-sm mt-1 flex items-center gap-1 font-medium',
                isPositive ? 'text-green-600' : 'text-red-500'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend}
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            'rounded-xl p-3',
            colors.iconBg,
            colors.iconText
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
