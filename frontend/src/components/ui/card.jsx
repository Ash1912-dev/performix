import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-2 p-6 pb-3 text-gray-900', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-gray-900 font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-slate-500', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn('p-6 pt-3 text-gray-900', className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-3 p-6 pt-0 text-gray-900', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
