import { useMemo, useState } from'react';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import { Lock, Pencil, Plus, Trash2 } from'lucide-react';
import toast from'react-hot-toast';

import { deleteGoal, getMyGoals } from'@/api/goalApi';
import GoalFormModal from'@/components/employee/GoalFormModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import AlertDialog from'@/components/ui/alert-dialog';
import { Button } from'@/components/ui/button';
import { Card, CardContent } from'@/components/ui/card';
import { getStatusTone, getUomLabel, getUomTone } from'@/utils/employeeHelpers';

function Goals() {
 const queryClient = useQueryClient();
 const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
 const [selectedGoal, setSelectedGoal] = useState(null);
 const [deleteCandidate, setDeleteCandidate] = useState(null);

 const { data: goalSheet, isLoading, isError } = useQuery({
 queryKey: ['myGoals'],
 queryFn: getMyGoals,
 });

 const deleteMutation = useMutation({
 mutationFn: (id) => deleteGoal(id),
 onSuccess: () => {
 queryClient.invalidateQueries(['myGoals']);
 toast.success('Goal deleted!');
 },
 onError: (err) => {
 toast.error(err.response?.data?.message || 'Cannot delete locked goal');
 },
 });

 const totalWeightage = goalSheet?.totalWeightage || 0;
 const weightageTone = useMemo(() => {
 if (totalWeightage === 100) {
 return'bg-emerald-500';
 }

 if (totalWeightage > 100) {
 return'bg-rose-500';
 }

 return'bg-amber-500';
 }, [totalWeightage]);

 if (isLoading) {
 return <LoadingSkeleton type="list" rows={4} />;
 }

 if (isError) {
 return (
 <EmptyState
 title="Unable to load goals"
 description="We couldn't retrieve your goals right now. Please try again shortly."
 />
);
 }

 return (
 <div className="space-y-6 p-6 text-gray-900">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 My Goals
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Manage your goal portfolio
 </h1>
 </div>
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() => {
 setSelectedGoal(null);
 setIsGoalModalOpen(true);
 }}
 >
 <Plus className="size-4" />
 Add Goal
 </Button>
 </div>

 <Card>
 <CardContent className="space-y-3 p-6">
 <div className="flex items-center justify-between text-sm font-medium text-gray-700">
 <span>Total Weightage</span>
 <span>{totalWeightage} / 100%</span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-slate-100">
 <div
 className={`h-full rounded-full transition-all duration-700 ${weightageTone}`}
 style={{ width: `${Math.min(totalWeightage, 100)}%` }}
 />
 </div>
 </CardContent>
 </Card>

 {goalSheet?.status ==='approved' ? (
 <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
 Goals are locked. Contact admin to make changes.
 </div>
) : null}

 {goalSheet?.goals?.length ? (
 <div className="grid gap-4 xl:grid-cols-2">
 {goalSheet.goals.map((goal) => (
 <Card key={goal._id} className="relative overflow-hidden">
 <CardContent className="space-y-5 p-6">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h3 className="text-xl font-bold text-gray-900">{goal.title}</h3>
 <p className="mt-1 text-sm text-gray-500">{goal.thrustArea}</p>
 </div>
 <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(goal.status)}`}>
 {goal.status}
 </span>
 </div>

 <div className="flex flex-wrap gap-2">
 <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getUomTone(goal.uomType)}`}>
 {getUomLabel(goal.uomType)}
 </span>
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-600">
 <span className="font-semibold text-gray-900">Target:</span>{''}
 {goal.uomType ==='timeline'
 ? goal.targetDate
 ? new Date(goal.targetDate).toLocaleDateString()
 :'N/A'
 : goal.target ??'N/A'}
 </div>
 <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-600">
 <span className="font-semibold text-gray-900">Weightage:</span> {goal.weightage}%
 </div>
 </div>

 <div className="flex items-center gap-3">
 <Button
 type="button"
 variant="outline"
 className="rounded-xl"
 disabled={goal.isLocked}
 onClick={() => {
 setSelectedGoal(goal);
 setIsGoalModalOpen(true);
 }}
 >
 {goal.isLocked ? <Lock className="size-4" /> : <Pencil className="size-4" />}
 Edit
 </Button>
 <Button
 type="button"
 variant="outline"
 className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
 disabled={goal.isLocked || deleteMutation.isPending}
 onClick={() => {
 if (window.confirm('Delete this goal?')) deleteMutation.mutate(goal._id);
 }}
 >
 {goal.isLocked ? <Lock className="size-4" /> : <Trash2 className="size-4" />}
 {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
 </Button>
 </div>
 </CardContent>
 </Card>
))}
 </div>
) : (
 <EmptyState
 title="No goals yet"
 description="Start by adding your first goal to build out your goal sheet."
 actionLabel="Add Goal"
 onAction={() => {
 setSelectedGoal(null);
 setIsGoalModalOpen(true);
 }}
 />
)}

 <GoalFormModal
 isOpen={isGoalModalOpen}
 onClose={() => setIsGoalModalOpen(false)}
 existingGoal={selectedGoal}
 currentTotalWeightage={goalSheet?.totalWeightage || 0}
 goalCount={goalSheet?.goals?.length || 0}
 />

 <AlertDialog
 open={Boolean(deleteCandidate)}
 onOpenChange={(next) => !next && setDeleteCandidate(null)}
 title="Delete Goal"
 description="This action cannot be undone. The selected goal will be removed from your goal sheet."
 actionLabel={deleteMutation.isPending ?'Deleting...' :'Delete Goal'}
 onAction={() => deleteMutation.mutate(deleteCandidate._id)}
 destructive
 />
 </div>
);
}

export default Goals;
