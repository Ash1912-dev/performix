import { cn } from '@/lib/utils';

function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-gray-900 shadow-sm transition-all outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export { Input };
