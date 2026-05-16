import { useEffect } from'react';
import { zodResolver } from'@hookform/resolvers/zod';
import { useMutation, useQueryClient } from'@tanstack/react-query';
import { Loader2, Target } from'lucide-react';
import { useForm, useWatch } from'react-hook-form';
import toast from'react-hot-toast';
import { z } from'zod';

import { createGoal, updateGoal } from'@/api/goalApi';
import AISuggestButton from'@/components/employee/AISuggestButton';
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
import { Textarea } from'@/components/ui/textarea';

const goalSchema = z
 .object({
 thrustArea: z.string().min(1,'Thrust area is required'),
 title: z.string().min(3,'Goal title must be at least 3 characters'),
 description: z.string().optional(),
 uomType: z.enum(['min','max','timeline','zero']),
 target: z.coerce.number().optional(),
 targetDate: z.string().optional(),
 weightage: z.coerce.number().min(10,'Minimum weightage is 10').max(100,'Maximum weightage is 100'),
 })
 .superRefine((data, ctx) => {
 if (data.uomType !=='zero' && (!data.target || data.target <= 0)) {
 ctx.addIssue({
 code: z.ZodIssueCode.custom,
 path: ['target'],
 message:'Target must be a positive number',
 });
 }

 if (data.uomType ==='timeline' && !data.targetDate) {
 ctx.addIssue({
 code: z.ZodIssueCode.custom,
 path: ['targetDate'],
 message:'Target date is required for timeline goals',
 });
 }
 });

function GoalFormModal({
 isOpen,
 onClose,
 existingGoal = null,
 currentTotalWeightage = 0,
 goalCount = 0,
}) {
 const queryClient = useQueryClient();
 const isEditing = Boolean(existingGoal);

 const form = useForm({
 resolver: zodResolver(goalSchema),
 defaultValues: {
 thrustArea:'',
 title:'',
 description:'',
 uomType:'min',
 target: undefined,
 targetDate:'',
 weightage: 10,
 },
 });

 useEffect(() => {
 if (existingGoal) {
 form.reset({
 thrustArea: existingGoal.thrustArea ||'',
 title: existingGoal.title ||'',
 description: existingGoal.description ||'',
 uomType: existingGoal.uomType ||'min',
 target: existingGoal.target ?? undefined,
 targetDate: existingGoal.targetDate
 ? new Date(existingGoal.targetDate).toISOString().split('T')[0]
 :'',
 weightage: existingGoal.weightage || 10,
 });
 return;
 }

 form.reset({
 thrustArea:'',
 title:'',
 description:'',
 uomType:'min',
 target: undefined,
 targetDate:'',
 weightage: 10,
 });
 }, [existingGoal, form, isOpen]);

 const uomType = useWatch({ control: form.control, name:'uomType' });
 const watchedWeightage = Number(useWatch({ control: form.control, name:'weightage' }) || 0);
 const currentGoalWeightage = existingGoal?.weightage || 0;
 const remainingWeightage =
 100 - (currentTotalWeightage - currentGoalWeightage + watchedWeightage);

 const mutation = useMutation({
 mutationFn: async (values) => {
 const payload = {
 thrustArea: values.thrustArea,
 title: values.title,
 description: values.description,
 uomType: values.uomType,
 target: values.uomType ==='zero' ? undefined : Number(values.target),
 targetDate: values.uomType ==='timeline' ? values.targetDate : undefined,
 weightage: Number(values.weightage),
 };

 if (isEditing) {
 return updateGoal(existingGoal._id, payload);
 }

 return createGoal(payload);
 },
 onSuccess: () => {
 toast.success(isEditing ?'Goal updated successfully' :'Goal created successfully');
 queryClient.invalidateQueries({ queryKey: ['myGoals'] });
 onClose();
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Unable to save goal');
 },
 });

 const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

 const handleAISuggestion = (suggestion) => {
 if (suggestion.title) form.setValue('title', suggestion.title);
 if (suggestion.description) form.setValue('description', suggestion.description);
 if (suggestion.uomType) form.setValue('uomType', suggestion.uomType);
 if (suggestion.suggestedTarget != null) form.setValue('target', suggestion.suggestedTarget);
 if (suggestion.weightageSuggestion) form.setValue('weightage', suggestion.weightageSuggestion);
 // Keep user-entered thrustArea if already filled
 if (!form.getValues('thrustArea') && suggestion.thrustArea) {
 form.setValue('thrustArea', suggestion.thrustArea);
 }
 toast.success('AI suggestion applied! Review and adjust as needed.');
 };

 return (
 <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
 <DialogContent onOpenChange={(next) => !next && onClose()}>
 <DialogHeader>
 <div className="flex items-center justify-between gap-3">
 <DialogTitle>{isEditing ?'Edit Goal' :'Create New Goal'}</DialogTitle>
 {!isEditing && <AISuggestButton onAccept={handleAISuggestion} />}
 </div>
 <DialogDescription>
 Set up a focused, measurable goal with clear outcomes and balanced weightage.
 </DialogDescription>
 </DialogHeader>

 <form className="space-y-5" onSubmit={onSubmit}>
 <div className="grid gap-5 md:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="thrustArea">Thrust Area</Label>
 <Input id="thrustArea" {...form.register('thrustArea')} />
 {form.formState.errors.thrustArea ? (
 <p className="text-sm text-rose-600">{form.formState.errors.thrustArea.message}</p>
) : null}
 </div>
 <div className="space-y-2">
 <Label htmlFor="title">Goal Title</Label>
 <Input id="title" {...form.register('title')} />
 {form.formState.errors.title ? (
 <p className="text-sm text-rose-600">{form.formState.errors.title.message}</p>
) : null}
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="description">Description</Label>
 <Textarea id="description" {...form.register('description')} />
 </div>

 <div className="grid gap-5 md:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="uomType">UoM Type</Label>
 <Select id="uomType" {...form.register('uomType')}>
 <option value="min">Higher is Better (e.g. Sales Revenue)</option>
 <option value="max">Lower is Better (e.g. Cost, TAT)</option>
 <option value="timeline">Date-based Completion</option>
 <option value="zero">Zero = Success (e.g. Safety Incidents)</option>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="weightage">Weightage</Label>
 <Input id="weightage" type="number" min="10" max="100" {...form.register('weightage')} />
 <div
 className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
 remainingWeightage >= 0
 ?'bg-emerald-50 text-emerald-700'
 :'bg-rose-50 text-rose-700'
 }`}
 >
 <Target className="size-4" />
 Remaining: {remainingWeightage}%
 </div>
 {form.formState.errors.weightage ? (
 <p className="text-sm text-rose-600">{form.formState.errors.weightage.message}</p>
) : null}
 </div>
 </div>

 {uomType !=='zero' ? (
 <div className="space-y-2">
 <Label htmlFor="target">Target</Label>
 <Input id="target" type="number" {...form.register('target')} />
 {form.formState.errors.target ? (
 <p className="text-sm text-rose-600">{form.formState.errors.target.message}</p>
) : null}
 </div>
) : null}

 {uomType ==='timeline' ? (
 <div className="space-y-2">
 <Label htmlFor="targetDate">Target Date</Label>
 <Input id="targetDate" type="date" {...form.register('targetDate')} />
 {form.formState.errors.targetDate ? (
 <p className="text-sm text-rose-600">{form.formState.errors.targetDate.message}</p>
) : null}
 </div>
) : null}

 <DialogFooter>
 <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
 Cancel
 </Button>
 <Button
 type="submit"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 disabled={mutation.isPending || (!isEditing && goalCount >= 8)}
 >
 {mutation.isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Saving...
 </>
) : isEditing ? (
'Update Goal'
) : goalCount >= 8 ? (
'Maximum 8 Goals Reached'
) : (
'Create Goal'
)}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
);
}

export default GoalFormModal;
