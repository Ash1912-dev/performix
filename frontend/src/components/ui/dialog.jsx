import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

function Dialog({ open, onOpenChange, children }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-2xl">{children}</div>
    </div>
  );
}

function DialogContent({ className, children, onOpenChange }) {
  return (
    <div
      className={cn(
        'relative rounded-[2rem] border border-slate-200 bg-white text-gray-900 p-6 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.4)] sm:p-8',
        className
      )}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        onClick={() => onOpenChange(false)}
      >
        <X className="size-4" />
      </button>
      {children}
    </div>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-6 space-y-2', className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return (
    <h2
      className={cn('text-gray-900 font-semibold text-lg', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-gray-500 text-sm', className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
