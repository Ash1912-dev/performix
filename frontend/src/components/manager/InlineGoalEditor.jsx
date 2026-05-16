import { useState } from'react';
import { useMutation, useQueryClient } from'@tanstack/react-query';
import { Loader2, Pencil, Save, X } from'lucide-react';
import toast from'react-hot-toast';

import { managerEditGoal } from'@/api/managerApi';
import { Button } from'@/components/ui/button';
import { Input } from'@/components/ui/input';
import { formatGoalTarget } from'@/utils/managerHelpers';

function InlineGoalEditor({ goal, onSave }) {
 const queryClient = useQueryClient();
 const [isEditing, setIsEditing] = useState(false);
 const [target, setTarget] = useState(
 goal.uomType ==='timeline'
 ? goal.targetDate
 ? new Date(goal.targetDate).toISOString().split('T')[0]
 :''
 : goal.target ??''
);
 const [weightage, setWeightage] = useState(goal.weightage ?? 10);

 const resetForm = () => {
 setTarget(
 goal.uomType ==='timeline'
 ? goal.targetDate
 ? new Date(goal.targetDate).toISOString().split('T')[0]
 :''
 : goal.target ??''
);
 setWeightage(goal.weightage ?? 10);
 setIsEditing(false);
 };

 const mutation = useMutation({
 mutationFn: async () => {
 const payload = {
 weightage: Number(weightage),
 };

 if (goal.uomType ==='timeline') {
 payload.targetDate = target || null;
 } else if (goal.uomType !=='zero') {
 payload.target = Number(target);
 } else {
 payload.target = 0;
 }

 return managerEditGoal(goal._id, payload);
 },
 onSuccess: (data) => {
 toast.success('Goal updated successfully');
 queryClient.invalidateQueries({ queryKey: ['managerTeamGoals'] });
 onSave?.(data);
 setIsEditing(false);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Unable to update goal');
 },
 });

 return (
 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
 {!isEditing ? (
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
 <div>
 <span className="font-semibold text-gray-900">Current Target:</span>{''}
 {formatGoalTarget(goal)}
 </div>
 <div>
 <span className="font-semibold text-gray-900">Current Weightage:</span>{''}
 {goal.weightage}%
 </div>
 </div>
 <Button
 type="button"
 variant="outline"
 className="rounded-xl"
 onClick={() => setIsEditing(true)}
 >
 <Pencil className="size-4" />
 Edit Goal
 </Button>
 </div>
) : (
 <div className="space-y-4">
 <div className="grid gap-3 md:grid-cols-2">
 <div className="space-y-2">
 <div className="text-sm font-medium text-gray-700">
 {goal.uomType ==='timeline' ?'Target Date' :'Target'}
 </div>
 <Input
 type={goal.uomType ==='timeline' ?'date' :'number'}
 value={target}
 onChange={(event) => setTarget(event.target.value)}
 disabled={goal.uomType ==='zero'}
 />
 </div>
 <div className="space-y-2">
 <div className="text-sm font-medium text-gray-700">Weightage</div>
 <Input
 type="number"
 min="10"
 max="100"
 value={weightage}
 onChange={(event) => setWeightage(event.target.value)}
 />
 </div>
 </div>

 <div className="flex flex-wrap gap-3">
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 disabled={mutation.isPending}
 onClick={() => mutation.mutate()}
 >
 {mutation.isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Saving...
 </>
) : (
 <>
 <Save className="size-4" />
 Save Changes
 </>
)}
 </Button>
 <Button type="button" variant="outline" className="rounded-xl" onClick={resetForm}>
 <X className="size-4" />
 Cancel
 </Button>
 </div>
 </div>
)}
 </div>
);
}

export default InlineGoalEditor;
