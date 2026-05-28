import { useMemo, useState } from'react';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import {
 AlertTriangle,
 CalendarDays,
 CheckCircle2,
 ClipboardList,
 Plus,
 Scale,
 Send,
} from'lucide-react';
import toast from'react-hot-toast';

import { getMyCheckIns } from'@/api/checkinApi';
import { getMyGoals, submitGoalSheet } from'@/api/goalApi';
import GoalFormModal from'@/components/employee/GoalFormModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import StatCard from'@/components/shared/StatCard';
import { Button } from'@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card';
import { useAuthStore } from'@/store/authStore';
import { getActivePeriodInfo, getStatusTone } from'@/utils/employeeHelpers';

function Dashboard() {
 const queryClient = useQueryClient();
 const user = useAuthStore((state) => state.user);
 const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
 const activePeriod = getActivePeriodInfo();

 const { data: goalSheet, isLoading: goalsLoading, isError } = useQuery({
 queryKey: ['myGoals'],
 queryFn: getMyGoals,
 });

 const { data: checkIns = [], isLoading: checkInsLoading } = useQuery({
 queryKey: ['myCheckIns'],
 queryFn: getMyCheckIns,
 });

 const submitMutation = useMutation({
 mutationFn: submitGoalSheet,
 onSuccess: () => {
 queryClient.invalidateQueries(['myGoals']);
 toast.success('Goal sheet submitted!');
 },
 onError: (err) => {
 toast.error(err.response?.data?.message || 'Failed to submit');
 },
 });

 const currentDate = new Date().toLocaleDateString(undefined, {
 weekday:'long',
 day:'numeric',
 month:'long',
 year:'numeric',
 });

 const metrics = useMemo(() => {
 const goals = goalSheet?.goals || [];
 const currentQuarterCheckIns = activePeriod.quarter
 ? checkIns.filter((item) => item.quarter === activePeriod.quarter)
 : [];

 return {
 totalGoals: goals.length,
 approvedGoals: goals.filter((goal) => goal.status ==='approved').length,
 totalWeightage: goalSheet?.totalWeightage || 0,
 checkInsThisQuarter: currentQuarterCheckIns.length,
 };
 }, [activePeriod.quarter, checkIns, goalSheet]);

 const goalProgress = useMemo(() => {
 return (goalSheet?.goals || []).map((goal) => {
 const relevantCheckIns = checkIns
 .filter((item) => {
 const goalId = item.goalId?._id || item.goalId;
 return goalId === goal._id;
 })
 .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

 return {
 ...goal,
 latestCheckIn: relevantCheckIns[0] || null,
 };
 });
 }, [checkIns, goalSheet]);

 if (goalsLoading || checkInsLoading) {
 return <LoadingSkeleton type="card" />;
 }

 if (isError) {
 return (
 <EmptyState
 title="Unable to load dashboard"
 description="We couldn't fetch your dashboard data right now. Please refresh and try again."
 />
);
 }

 if (!goalSheet?.goals?.length) {
 return (
 <>
 <EmptyState
 title="No goals yet"
 description="Start building your performance cycle by adding your first goal."
 actionLabel="Add New Goal"
 onAction={() => setIsGoalModalOpen(true)}
 />
 <GoalFormModal
 isOpen={isGoalModalOpen}
 onClose={() => setIsGoalModalOpen(false)}
 currentTotalWeightage={goalSheet?.totalWeightage || 0}
 goalCount={goalSheet?.goals?.length || 0}
 />
 </>
);
 }

 return (
 <div className="space-y-6 p-6 text-gray-900">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 Good morning, {user?.name}
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Stay focused on what matters most
 </h1>
 <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
 <CalendarDays className="size-4 text-blue-600" />
 {currentDate}
 </div>
 </div>
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() => setIsGoalModalOpen(true)}
 >
 <Plus className="size-4" />
 Add New Goal
 </Button>
 </div>

 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <StatCard title="Total Goals" value={metrics.totalGoals} icon={ClipboardList} color="blue" />
 <StatCard title="Approved Goals" value={metrics.approvedGoals} icon={CheckCircle2} color="green" />
 <StatCard title="Total Weightage" value={`${metrics.totalWeightage}%`} icon={Scale} color="amber" />
 <StatCard title="Check-ins This Quarter" value={metrics.checkInsThisQuarter} icon={Send} color="red" />
 </div>

 <div
 className={`rounded-[1.75rem] border px-6 py-5 ${
 activePeriod.variant ==='blue'
 ?'border-blue-200 bg-blue-50 text-blue-800'
 :'border-slate-200 bg-slate-50 text-gray-700'
 }`}
 >
 <div className="text-sm font-semibold uppercase tracking-[0.18em]">
 Active Period
 </div>
 <div className="mt-2 text-xl font-bold">
 {activePeriod.period
 ? `${activePeriod.period} — Window Open`
 :'No active check-in window'}
 </div>
 </div>

 <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
 <Card>
 <CardHeader className="p-6 pb-3">
 <CardTitle className="text-xl">Goal Sheet Status</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 p-6 pt-0">
 <div className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] ${getStatusTone(goalSheet?.status)}`}>
 {goalSheet?.status ||'draft'}
 </div>

 {goalSheet?.status ==='returned' ? (
 <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
 <AlertTriangle className="mt-0.5 size-5" />
 <div>
 <div className="font-semibold">Your goal sheet was returned for rework.</div>
 <p className="mt-1 text-sm leading-6">
 Please review and resubmit.
 </p>
 </div>
 </div>
) : null}

 {goalSheet?.status ==='draft' ? (
 metrics.totalWeightage === 100 ? (
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/25 transition-all"
 disabled={submitMutation.isPending}
 onClick={() => {
 if (window.confirm('Submit goals for approval?')) submitMutation.mutate();
 }}
 >
 <Send className="size-4" />
 {submitMutation.isPending ? 'Submitting...' : 'Submit Goal Sheet'}
 </Button>
) : (
 <p className="text-sm text-gray-500">
 Total weightage must equal 100% to submit.
 </p>
)
) : null}

 {goalSheet?.status ==='submitted' ? (
 <p className="text-sm text-gray-500">
 Your goals have been submitted and are pending manager approval. You cannot make edits at this time.
 </p>
) : null}

 {goalSheet?.status ==='approved' ? (
 <p className="text-sm text-gray-500">
 Your goals are approved and locked for the current cycle. You can now focus on check-ins.
 </p>
) : null}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="p-6 pb-3">
 <CardTitle className="text-xl">Goals Progress</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 p-6 pt-0">
 {goalProgress.map((goal) => {
 const progress = Math.round(goal.latestCheckIn?.progressScore || 0);
 return (
 <div key={goal._id} className="rounded-2xl border border-slate-200 p-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <div className="font-semibold text-gray-900">{goal.title}</div>
 <div className="mt-1 text-sm text-gray-500">{goal.thrustArea}</div>
 </div>
 <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-700">
 {goal.weightage}%
 </span>
 </div>
 <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
 <div
 className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
 style={{ width: `${Math.min(progress, 100)}%` }}
 />
 </div>
 <div className="mt-2 text-sm text-gray-500">
 {goal.latestCheckIn ? `${progress}% latest progress` :'No check-in yet'}
 </div>
 </div>
);
 })}
 </CardContent>
 </Card>
 </div>

 <GoalFormModal
 isOpen={isGoalModalOpen}
 onClose={() => setIsGoalModalOpen(false)}
 currentTotalWeightage={goalSheet?.totalWeightage || 0}
 goalCount={goalSheet?.goals?.length || 0}
 />
 </div>
);
}

export default Dashboard;
