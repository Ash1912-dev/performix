import { AlertTriangle, Loader2 } from'lucide-react';

import { Button } from'@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from'@/components/ui/dialog';

function ConfirmDialog({
 isOpen,
 onClose,
 onConfirm,
 title ='Are you sure?',
 description ='This action cannot be undone.',
 confirmLabel ='Confirm',
 confirmVariant ='default',
 isPending = false,
}) {
 const isDestructive = confirmVariant ==='destructive';

 return (
 <Dialog open={isOpen} onOpenChange={onClose}>
 <DialogContent onOpenChange={onClose} className="max-w-lg">
 <DialogHeader>
 <div
 className={`mb-4 flex size-12 items-center justify-center rounded-2xl ${
 isDestructive ?'bg-rose-50 text-rose-600' :'bg-blue-50 text-blue-600'
 }`}
 >
 <AlertTriangle className="size-5" />
 </div>
 <DialogTitle>{title}</DialogTitle>
 <DialogDescription>{description}</DialogDescription>
 </DialogHeader>
 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 className="rounded-xl"
 onClick={onClose}
 disabled={isPending}
 >
 Cancel
 </Button>
 <Button
 type="button"
 className={`rounded-xl ${
 isDestructive
 ?'bg-rose-600 text-white hover:bg-rose-700'
 :'bg-blue-600 text-white hover:bg-blue-700'
 }`}
 onClick={onConfirm}
 disabled={isPending}
 >
 {isPending && <Loader2 className="size-4 animate-spin" />}
 {confirmLabel}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
);
}

export default ConfirmDialog;
