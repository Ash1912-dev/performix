import { zodResolver } from'@hookform/resolvers/zod';
import { useMutation, useQueryClient } from'@tanstack/react-query';
import { Loader2, Undo2 } from'lucide-react';
import { useEffect } from'react';
import { useForm } from'react-hook-form';
import toast from'react-hot-toast';
import { z } from'zod';

import { returnGoalSheet } from'@/api/managerApi';
import { Button } from'@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from'@/components/ui/dialog';
import { Label } from'@/components/ui/label';
import { Textarea } from'@/components/ui/textarea';

const schema = z.object({
 reason: z
 .string()
 .trim()
 .min(10,'Reason must be at least 10 characters long'),
});

function ReturnReasonModal({ isOpen, onClose, sheetId, employeeName }) {
 const queryClient = useQueryClient();
 const form = useForm({
 resolver: zodResolver(schema),
 defaultValues: {
 reason:'',
 },
 });

 useEffect(() => {
 if (isOpen) {
 form.reset({ reason:'' });
 }
 }, [form, isOpen]);

 const mutation = useMutation({
 mutationFn: (values) => returnGoalSheet(sheetId, values.reason),
 onSuccess: () => {
 toast.success('Goal sheet returned for rework');
 queryClient.invalidateQueries({ queryKey: ['managerTeamGoals'] });
 onClose();
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Unable to return goal sheet');
 },
 });

 const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

 return (
 <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
 <DialogContent onOpenChange={(next) => !next && onClose()} className="max-w-xl">
 <DialogHeader>
 <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
 <Undo2 className="size-5" />
 </div>
 <DialogTitle>Return Goal Sheet</DialogTitle>
 <DialogDescription>
 Share specific feedback for {employeeName ||'this employee'} so they can revise
 and resubmit with confidence.
 </DialogDescription>
 </DialogHeader>

 <form className="space-y-4" onSubmit={onSubmit}>
 <div className="space-y-2">
 <Label htmlFor="reason">Reason for returning</Label>
 <Textarea
 id="reason"
 rows={5}
 placeholder="Explain what should change before approval..."
 {...form.register('reason')}
 />
 {form.formState.errors.reason ? (
 <p className="text-sm text-rose-600">{form.formState.errors.reason.message}</p>
) : null}
 </div>

 <DialogFooter>
 <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
 Cancel
 </Button>
 <Button
 type="submit"
 className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
 disabled={mutation.isPending}
 >
 {mutation.isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Returning...
 </>
) : (
'Return for Rework'
)}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
);
}

export default ReturnReasonModal;
