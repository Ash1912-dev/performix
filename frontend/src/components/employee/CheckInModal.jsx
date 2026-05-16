import { useEffect, useMemo } from'react';
import { zodResolver } from'@hookform/resolvers/zod';
import { useMutation, useQueryClient } from'@tanstack/react-query';
import { CheckCircle2, Loader2 } from'lucide-react';
import { useForm } from'react-hook-form';
import toast from'react-hot-toast';
import { z } from'zod';

import { submitCheckIn } from'@/api/checkinApi';
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
import { calculateScore, getActivePeriodInfo } from'@/utils/employeeHelpers';

const checkinSchema = z.object({
 quarter: z.string(),
 actualAchievement: z.coerce.number().optional(),
 achievementDate: z.string().optional(),
 status: z.enum(['not_started','on_track','completed']),
 zeroAchievement: z.boolean().optional(),
});

function CheckInModal({ isOpen, onClose, goal }) {
 const queryClient = useQueryClient();
 const activePeriod = getActivePeriodInfo();

 const form = useForm({
 resolver: zodResolver(checkinSchema),
 defaultValues: {
 quarter: activePeriod.quarter ||'',
 actualAchievement: undefined,
 achievementDate:'',
 status:'on_track',
 zeroAchievement: true,
 },
 });

 useEffect(() => {
 form.reset({
 quarter: activePeriod.quarter ||'',
 actualAchievement: undefined,
 achievementDate:'',
 status:'on_track',
 zeroAchievement: true,
 });
 }, [activePeriod.quarter, form, isOpen, goal]);

 const zeroAchievement = form.watch('zeroAchievement');
 const actualAchievement = form.watch('actualAchievement');
 const achievementDate = form.watch('achievementDate');

 const estimatedScore = useMemo(() => {
 if (!goal) {
 return 0;
 }

 return Math.round(
 calculateScore({
 uomType: goal.uomType,
 target: goal.target,
 actual: goal.uomType ==='zero' ? (zeroAchievement ? 0 : 1) : actualAchievement,
 targetDate: goal.targetDate,
 achievementDate,
 })
);
 }, [achievementDate, actualAchievement, goal, zeroAchievement]);

 const mutation = useMutation({
 mutationFn: (values) =>
 submitCheckIn({
 goalId: goal._id,
 quarter: values.quarter,
 actualAchievement:
 goal.uomType ==='zero'
 ? values.zeroAchievement
 ? 0
 : 1
 : Number(values.actualAchievement),
 achievementDate: values.achievementDate || undefined,
 status: values.status,
 }),
 onSuccess: () => {
 toast.success('Check-in submitted successfully');
 queryClient.invalidateQueries({ queryKey: ['myCheckIns'] });
 queryClient.invalidateQueries({ queryKey: ['myGoals'] });
 onClose();
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Unable to submit check-in');
 },
 });

 const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

 if (!goal) {
 return null;
 }

 return (
 <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
 <DialogContent onOpenChange={(next) => !next && onClose()} className="max-w-xl">
 <DialogHeader>
 <DialogTitle>Submit Check-in</DialogTitle>
 <DialogDescription>
 Update your latest progress for this approved goal.
 </DialogDescription>
 </DialogHeader>

 <form className="space-y-5" onSubmit={onSubmit}>
 <div className="grid gap-5 md:grid-cols-2">
 <div className="space-y-2">
 <Label>Quarter</Label>
 <Input readOnly value={activePeriod.quarter ||'No active quarter'} />
 </div>
 <div className="space-y-2">
 <Label>Planned Target</Label>
 <Input readOnly value={goal.target ??'N/A'} />
 </div>
 </div>

 {goal.uomType ==='zero' ? (
 <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-700">
 <input type="checkbox" className="size-4 rounded" {...form.register('zeroAchievement')} />
 Zero Achievement
 </label>
) : (
 <div className="space-y-2">
 <Label htmlFor="actualAchievement">Actual Achievement</Label>
 <Input id="actualAchievement" type="number" {...form.register('actualAchievement')} />
 </div>
)}

 {goal.uomType ==='timeline' ? (
 <div className="space-y-2">
 <Label htmlFor="achievementDate">Achievement Date</Label>
 <Input id="achievementDate" type="date" {...form.register('achievementDate')} />
 </div>
) : null}

 <div className="space-y-2">
 <Label htmlFor="status">Status</Label>
 <Select id="status" {...form.register('status')}>
 <option value="not_started">Not Started</option>
 <option value="on_track">On Track</option>
 <option value="completed">Completed</option>
 </Select>
 </div>

 <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-800">
 <CheckCircle2 className="size-5" />
 <span className="text-sm font-medium">
 {goal.uomType ==='timeline'
 ? `Estimated Score: ${achievementDate ? estimatedScore :'Based on date selected'}${achievementDate ?'%' :''}`
 : `Estimated Score: ${estimatedScore}%`}
 </span>
 </div>

 <DialogFooter>
 <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
 Cancel
 </Button>
 <Button
 type="submit"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 disabled={mutation.isPending || !activePeriod.quarter}
 >
 {mutation.isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Submitting...
 </>
) : (
'Submit Check-in'
)}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
);
}

export default CheckInModal;
