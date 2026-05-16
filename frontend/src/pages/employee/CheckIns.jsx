import { useMemo, useState } from'react';
import { useQuery } from'@tanstack/react-query';
import {
 CalendarClock,
 CheckCircle2,
 MessageSquareQuote,
} from'lucide-react';

import { getCheckInSummary, getMyCheckIns } from'@/api/checkinApi';
import { getMyGoals } from'@/api/goalApi';
import CheckInModal from'@/components/employee/CheckInModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import ProgressRing from'@/components/shared/ProgressRing';
import { Accordion } from'@/components/ui/accordion';
import { Button } from'@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card';
import { useAuthStore } from'@/store/authStore';
import {
 getActivePeriodInfo,
 getStatusTone,
 getUomTone,
} from'@/utils/employeeHelpers';

const QUARTERS = ['Q1','Q2','Q3','Q4'];

function CheckIns() {
 const user = useAuthStore((state) => state.user);
 const [selectedGoal, setSelectedGoal] = useState(null);
 const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
 const activePeriod = getActivePeriodInfo();

 const { data: goalSheet, isLoading: goalsLoading } = useQuery({
 queryKey: ['myGoals'],
 queryFn: getMyGoals,
 });

 const { data: checkIns = [], isLoading: checkInsLoading } = useQuery({
 queryKey: ['myCheckIns'],
 queryFn: getMyCheckIns,
 });

 const { data: summary = [], isLoading: summaryLoading, isError } = useQuery({
 queryKey: ['employeeCheckInSummary', user?._id],
 queryFn: () => getCheckInSummary(user._id),
 enabled: Boolean(user?._id),
 });

 const approvedGoals = useMemo(
 () => (goalSheet?.goals || []).filter((goal) => goalSheet?.status ==='approved' && goal.status ==='approved'),
 [goalSheet]
);

 const checkInMap = useMemo(() => {
 return checkIns.reduce((acc, item) => {
 const goalId = item.goalId?._id || item.goalId;
 if (!acc[goalId]) {
 acc[goalId] = {};
 }
 acc[goalId][item.quarter] = item;
 return acc;
 }, {});
 }, [checkIns]);

 if (goalsLoading || checkInsLoading || summaryLoading) {
 return <LoadingSkeleton type="list" rows={3} />;
 }

 if (isError) {
 return (
 <EmptyState
 title="Unable to load check-ins"
 description="We couldn't fetch your check-in data right now. Please try again later."
 />
);
 }

 if (goalSheet?.status !=='approved') {
 return (
 <div className="space-y-6 p-6 text-gray-900">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 My Check-ins
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Quarterly progress updates
 </h1>
 </div>
 <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
 Your goals must be approved before you can submit check-ins.
 </div>
 </div>
);
 }

 return (
 <div className="space-y-6 p-6 text-gray-900">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 My Check-ins
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Quarterly progress updates
 </h1>
 </div>
 <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
 <CalendarClock className="size-4" />
 {activePeriod.quarter ||'No active quarter'}
 </div>
 </div>

 {approvedGoals.length ? (
 <div className="space-y-4">
 {approvedGoals.map((goal) => {
 const quarterCheckIn = activePeriod.quarter
 ? checkInMap[goal._id]?.[activePeriod.quarter]
 : null;
 const goalSummary = summary.find((item) => item.goal._id === goal._id);
 const accordionItems = QUARTERS.map((quarter) => {
 const item = checkInMap[goal._id]?.[quarter];
 return {
 value: quarter,
 label: quarter,
 content: item ? (
 <div className="space-y-2 text-sm text-gray-600">
 <div>Actual Achievement: {item.actualAchievement ??'N/A'}</div>
 <div>Progress Score: {Math.round(item.progressScore || 0)}%</div>
 <div>Status: {item.status}</div>
 <div>Manager Comment: {item.managerComment ||'No comment'}</div>
 </div>
) : (
 <div className="text-sm text-gray-500">No check-in recorded for this quarter.</div>
),
 };
 });

 return (
 <Card key={goal._id}>
 <CardHeader className="p-6 pb-3">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <CardTitle className="text-xl">{goal.title}</CardTitle>
 <div className="mt-2 flex flex-wrap gap-2">
 <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getUomTone(goal.uomType)}`}>
 {goal.uomType}
 </span>
 <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-700">
 Target: {goal.uomType ==='timeline' ? new Date(goal.targetDate).toLocaleDateString() : goal.target ??'N/A'}
 </span>
 </div>
 </div>
 </div>
 </CardHeader>

 <CardContent className="space-y-5 p-6 pt-2">
 <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
 <div className="mb-4 text-sm font-semibold text-gray-900">Current Quarter</div>
 {quarterCheckIn ? (
 <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
 <div className="space-y-2 text-sm text-gray-600">
 <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusTone(quarterCheckIn.status)}`}>
 {quarterCheckIn.status}
 </span>
 <div>Actual Achievement: {quarterCheckIn.actualAchievement ??'N/A'}</div>
 </div>
 <ProgressRing score={quarterCheckIn.progressScore || 0} color="#3b82f6" />
 </div>
) : activePeriod.quarter ? (
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() => {
 setSelectedGoal(goal);
 setIsCheckInModalOpen(true);
 }}
 >
 <CheckCircle2 className="size-4" />
 Submit Check-in
 </Button>
) : (
 <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-700">
 Window Closed
 </span>
)}
 </div>

 {goalSummary?.quarters?.find((item) => item.managerComment)?.managerComment ? (
 <blockquote className="rounded-2xl bg-slate-100 px-4 py-4 text-sm text-gray-700">
 <div className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
 <MessageSquareQuote className="size-4 text-gray-600" />
 Manager Comment
 </div>
 {goalSummary.quarters.find((item) => item.managerComment)?.managerComment}
 </blockquote>
) : null}

 <div>
 <div className="mb-3 text-sm font-semibold text-gray-900">Previous Check-ins</div>
 <Accordion items={accordionItems} />
 </div>
 </CardContent>
 </Card>
);
 })}
 </div>
) : (
 <EmptyState
 title="No approved goals yet"
 description="Once your goal sheet is approved, check-ins will become available here."
 />
)}

 <CheckInModal
 isOpen={isCheckInModalOpen}
 onClose={() => setIsCheckInModalOpen(false)}
 goal={selectedGoal}
 />
 </div>
);
}

export default CheckIns;
