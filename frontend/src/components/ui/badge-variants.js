import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] border',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-600 border-slate-200',
        employee: 'bg-blue-50 text-blue-700 border-blue-200',
        manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        admin: 'bg-violet-50 text-violet-700 border-violet-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        info: 'bg-blue-50 text-blue-700 border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
