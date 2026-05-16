import { useEffect } from'react';
import { useForm } from'react-hook-form';
import { zodResolver } from'@hookform/resolvers/zod';
import { useMutation, useQueryClient } from'@tanstack/react-query';
import { Loader2, ShieldAlert } from'lucide-react';
import toast from'react-hot-toast';
import { z } from'zod';

import { createRule, updateRule } from'@/api/escalationApi';
import { Button } from'@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from'@/components/ui/dialog';
import { Input } from'@/components/ui/input';
import { Label } from'@/components/ui/label';
import { Select } from'@/components/ui/select';

const ruleSchema = z.object({
 name: z.string().min(1,'Rule name is required'),
 triggerType: z.enum(['goal_not_submitted','goal_not_approved','checkin_not_completed']),
 daysThreshold: z.coerce.number().min(1,'Must be at least 1 day'),
 escalationChain: z.array(z.string()).min(1,'Select at least one recipient'),
 isActive: z.boolean(),
});

const TRIGGER_LABELS = {
 goal_not_submitted:'Goal Not Submitted',
 goal_not_approved:'Goal Not Approved',
 checkin_not_completed:'Check-in Not Completed',
};

const CHAIN_OPTIONS = [
 { value:'employee', label:'Employee' },
 { value:'manager', label:'Manager' },
 { value:'admin', label:'Admin' },
];

function EscalationRuleModal({ isOpen, onClose, existingRule }) {
 const queryClient = useQueryClient();
 const isEdit = Boolean(existingRule);

 const {
 register,
 handleSubmit,
 reset,
 formState: { errors },
 } = useForm({
 resolver: zodResolver(ruleSchema),
 defaultValues: {
 name:'',
 triggerType:'goal_not_submitted',
 daysThreshold: 3,
 escalationChain: ['manager'],
 isActive: true,
 },
 });

 useEffect(() => {
 if (isOpen && existingRule) {
 reset({
 name: existingRule.name ||'',
 triggerType: existingRule.triggerType ||'goal_not_submitted',
 daysThreshold: existingRule.daysThreshold || 3,
 escalationChain: existingRule.escalationChain || ['manager'],
 isActive: existingRule.isActive !== false,
 });
 } else if (isOpen) {
 reset({
 name:'',
 triggerType:'goal_not_submitted',
 daysThreshold: 3,
 escalationChain: ['manager'],
 isActive: true,
 });
 }
 }, [isOpen, existingRule, reset]);

 const mutation = useMutation({
 mutationFn: (data) => {
 if (isEdit) {
 return updateRule(existingRule._id, data);
 }
 return createRule(data);
 },
 onSuccess: () => {
 toast.success(isEdit ?'Rule updated' :'Rule created');
 queryClient.invalidateQueries({ queryKey: ['escalationRules'] });
 onClose();
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Failed to save rule');
 },
 });

 const onSubmit = (data) => {
 mutation.mutate(data);
 };

 return (
 <Dialog open={isOpen} onOpenChange={onClose}>
 <DialogContent onOpenChange={onClose} className="max-w-xl">
 <DialogHeader>
 <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
 <ShieldAlert className="size-5" />
 </div>
 <DialogTitle>{isEdit ?'Edit Escalation Rule' :'New Escalation Rule'}</DialogTitle>
 <DialogDescription>
 {isEdit
 ?'Modify the rule configuration below.'
 :'Define a new escalation trigger and notification chain.'}
 </DialogDescription>
 </DialogHeader>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
 <div className="space-y-2">
 <Label htmlFor="ruleName">Rule Name</Label>
 <Input id="ruleName" placeholder="e.g. Late Goal Submission" {...register('name')} />
 {errors.name && (
 <p className="text-xs text-rose-500">{errors.name.message}</p>
)}
 </div>

 <div className="grid gap-5 sm:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="triggerType">Trigger Type</Label>
 <Select id="triggerType" {...register('triggerType')}>
 {Object.entries(TRIGGER_LABELS).map(([val, label]) => (
 <option key={val} value={val}>{label}</option>
))}
 </Select>
 {errors.triggerType && (
 <p className="text-xs text-rose-500">{errors.triggerType.message}</p>
)}
 </div>

 <div className="space-y-2">
 <Label htmlFor="daysThreshold">Days Threshold</Label>
 <Input
 id="daysThreshold"
 type="number"
 min={1}
 placeholder="3"
 {...register('daysThreshold')}
 />
 {errors.daysThreshold && (
 <p className="text-xs text-rose-500">{errors.daysThreshold.message}</p>
)}
 </div>
 </div>

 <div className="space-y-3">
 <Label>Escalation Chain</Label>
 <div className="flex flex-wrap gap-4">
 {CHAIN_OPTIONS.map((option) => (
 <label
 key={option.value}
 className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50/50"
 >
 <input
 type="checkbox"
 value={option.value}
 className="size-4 rounded border-slate-300 accent-blue-600"
 {...register('escalationChain')}
 />
 {option.label}
 </label>
))}
 </div>
 {errors.escalationChain && (
 <p className="text-xs text-rose-500">{errors.escalationChain.message}</p>
)}
 </div>

 <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
 <input
 type="checkbox"
 className="size-4 rounded border-slate-300 accent-blue-600"
 {...register('isActive')}
 />
 <span className="font-medium text-gray-700">Rule Active</span>
 </label>

 <DialogFooter>
 <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
 Cancel
 </Button>
 <Button
 type="submit"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 disabled={mutation.isPending}
 >
 {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
 {isEdit ?'Save Changes' :'Create Rule'}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
);
}

export default EscalationRuleModal;
