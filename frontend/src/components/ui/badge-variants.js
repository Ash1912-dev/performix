import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        employee: 'bg-emerald-100 text-emerald-700',
        manager: 'bg-amber-100 text-amber-800',
        admin: 'bg-rose-100 text-rose-700',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-amber-100 text-amber-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
