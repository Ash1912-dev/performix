import { zodResolver } from'@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import { CheckSquare, Loader2, Send } from'lucide-react';
import { useMemo } from'react';
import { Controller, useForm, useWatch } from'react-hook-form';
import toast from'react-hot-toast';
import { z } from'zod';

import { getTeamGoals } from'@/api/managerApi';
import { pushSharedGoal } from'@/api/sharedGoalApi';
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

const schema = z
 .object({
 title: z.string().trim().min(3,'Goal title must be at least 3 characters'),
 description: z.string().optional(),
 thrustArea: z.string().trim().min(1,'Thrust area is required'),
 uomType: z.enum(['min','max','timeline','zero']),
 target: z.preprocess(
 (value) => (value ==='' || value === undefined || value === null ? undefined : Number(value)),
 z.number().optional()
),
 targetDate: z.string().optional(),
 employeeIds: z.array(z.string()).min(1,'Select at least one employee'),
 })
 .superRefine((values, ctx) => {
 if (values.uomType !=='zero' && values.uomType !=='timeline') {
 if (!Number.isFinite(values.target) || values.target <= 0) {
 ctx.addIssue({
 code: z.ZodIssueCode.custom,
 path: ['target'],
 message:'Target must be a positive number',
 });
 }
 }

 if (values.uomType ==='timeline' && !values.targetDate) {
 ctx.addIssue({
 code: z.ZodIssueCode.custom,
 path: ['targetDate'],
 message:'Target date is required for timeline goals',
 });
 }
 });

function SharedGoalModal({ isOpen, onClose }) {
 const queryClient = useQueryClient();
 const form = useForm({
 resolver: zodResolver(schema),
 defaultValues: {
 title:'',
 description:'',
 thrustArea:'',
 uomType:'min',
 target: undefined,
 targetDate:'',
 employeeIds: [],
 },
 });

 const { data: goalSheets, isLoading: teamLoading } = useQuery({
 queryKey: ['managerTeamGoals'],
 queryFn: getTeamGoals,
 enabled: isOpen,
 });

 // getTeamGoals returns an array of goal sheets, each with an `employee` field.
 // Deduplicate by employee._id to build the picker list.
 const teamMembers = useMemo(() => {
  if (!Array.isArray(goalSheets)) return [];
  const seen = new Map();
  goalSheets.forEach((sheet) => {
   const emp = sheet.employee;
   if (emp?._id && !seen.has(emp._id)) seen.set(emp._id, emp);
  });
  return Array.from(seen.values());
 }, [goalSheets]);
 const selectedEmployees = useWatch({
 control: form.control,
 name:'employeeIds',
 defaultValue: [],
 });
 const uomType = useWatch({
 control: form.control,
 name:'uomType',
 defaultValue:'min',
 });
 const allSelected = teamMembers.length > 0 && selectedEmployees.length === teamMembers.length;

 const mutation = useMutation({
 mutationFn: (values) =>
 pushSharedGoal({
 title: values.title,
 description: values.description,
 thrustArea: values.thrustArea,
 uomType: values.uomType,
 target:
 values.uomType ==='zero' || values.uomType ==='timeline'
 ? undefined
 : Number(values.target),
 targetDate: values.uomType ==='timeline' ? values.targetDate : undefined,
 employeeIds: values.employeeIds,
 }),
 onSuccess: (_, variables) => {
 toast.success(`Shared goal pushed to ${variables.employeeIds.length} employees`);
 queryClient.invalidateQueries({ queryKey: ['managerSharedGoals'] });
 queryClient.invalidateQueries({ queryKey: ['managerTeamGoals'] });
 form.reset();
 onClose();
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Unable to push shared goal');
 },
 });

 const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

 const toggleSelectAll = () => {
 form.setValue(
'employeeIds',
 allSelected ? [] : teamMembers.map((member) => member._id),
 { shouldValidate: true }
);
 };

 return (
 <Dialog
 open={isOpen}
 onOpenChange={(next) => {
 if (!next) {
 form.reset();
 onClose();
 }
 }}
 >
 <DialogContent
 onOpenChange={(next) => {
 if (!next) {
 form.reset();
 onClose();
 }
 }}
 className="max-w-3xl"
 >
 <DialogHeader>
 <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
 <Send className="size-5" />
 </div>
 <DialogTitle>Push Shared Goal</DialogTitle>
 <DialogDescription>
 Roll out a consistent goal across selected team members with one coordinated
 action.
 </DialogDescription>
 </DialogHeader>

 <form className="space-y-5" onSubmit={onSubmit}>
 <div className="grid gap-5 md:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="shared-title">Goal Title</Label>
 <Input id="shared-title" {...form.register('title')} />
 {form.formState.errors.title ? (
 <p className="text-sm text-rose-600">{form.formState.errors.title.message}</p>
) : null}
 </div>
 <div className="space-y-2">
 <Label htmlFor="shared-thrust-area">Thrust Area</Label>
 <Input id="shared-thrust-area" {...form.register('thrustArea')} />
 {form.formState.errors.thrustArea ? (
 <p className="text-sm text-rose-600">{form.formState.errors.thrustArea.message}</p>
) : null}
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="shared-description">Description</Label>
 <Textarea id="shared-description" rows={4} {...form.register('description')} />
 </div>

 <div className="grid gap-5 md:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="shared-uom">UoM Type</Label>
 <Select id="shared-uom" {...form.register('uomType')}>
 <option value="min">Higher is Better</option>
 <option value="max">Lower is Better</option>
 <option value="timeline">Date-based Completion</option>
 <option value="zero">Zero = Success</option>
 </Select>
 </div>

 {uomType ==='timeline' ? (
 <div className="space-y-2">
 <Label htmlFor="shared-target-date">Target Date</Label>
 <Input id="shared-target-date" type="date" {...form.register('targetDate')} />
 {form.formState.errors.targetDate ? (
 <p className="text-sm text-rose-600">
 {form.formState.errors.targetDate.message}
 </p>
) : null}
 </div>
) : uomType !=='zero' ? (
 <div className="space-y-2">
 <Label htmlFor="shared-target">Target</Label>
 <Input id="shared-target" type="number" {...form.register('target')} />
 {form.formState.errors.target ? (
 <p className="text-sm text-rose-600">{form.formState.errors.target.message}</p>
) : null}
 </div>
) : (
 <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
 This goal will be treated as zero-based success.
 </div>
)}
 </div>

 <div className="space-y-3">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <Label>Select Employees</Label>
 <p className="mt-1 text-sm text-gray-500">
 Choose the team members who should receive this shared goal.
 </p>
 </div>
 <Button type="button" variant="outline" className="rounded-xl" onClick={toggleSelectAll}>
 <CheckSquare className="size-4" />
 {allSelected ?'Clear All' :'Select All'}
 </Button>
 </div>

 <Controller
 control={form.control}
 name="employeeIds"
 render={({ field }) => (
 <div className="grid max-h-72 gap-3 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
 {teamLoading ? (
 <div className="text-sm text-gray-500">Loading team members...</div>
) : teamMembers.length ? (
 teamMembers.map((member) => (
 <label
 key={member._id}
 className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-700"
 >
 <input
 type="checkbox"
 className="mt-1 size-4 rounded border-slate-300"
 checked={field.value.includes(member._id)}
 onChange={(event) => {
 if (event.target.checked) {
 field.onChange([...field.value, member._id]);
 return;
 }

 field.onChange(field.value.filter((value) => value !== member._id));
 }}
 />
 <div>
 <div className="font-semibold text-gray-900">{member.name}</div>
 <div className="text-gray-500">{member.department ||'No department'}</div>
 </div>
 </label>
))
) : (
 <div className="text-sm text-gray-500">No team members found.</div>
)}
 </div>
)}
 />
 {form.formState.errors.employeeIds ? (
 <p className="text-sm text-rose-600">{form.formState.errors.employeeIds.message}</p>
) : null}
 </div>

 <DialogFooter>
 <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
 Cancel
 </Button>
 <Button
 type="submit"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 disabled={mutation.isPending || teamLoading || !teamMembers.length}
 >
 {mutation.isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Pushing...
 </>
) : (
'Push Shared Goal'
)}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
);
}

export default SharedGoalModal;
