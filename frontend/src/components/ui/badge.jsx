import { cn } from '@/lib/utils';
import { badgeVariants } from './badge-variants';

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge };
