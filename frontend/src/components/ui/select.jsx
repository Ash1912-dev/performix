import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          'flex h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm transition outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export { Select };
