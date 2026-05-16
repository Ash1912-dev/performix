import { useMemo, useState } from'react';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import { BarChart3, CalendarClock, MessageSquareText, Save } from'lucide-react';
import toast from'react-hot-toast';

import { addManagerComment, getTeamCheckIns } from'@/api/managerApi';
import CheckInSummaryModal from'@/components/manager/CheckInSummaryModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import ProgressRing from'@/components/shared/ProgressRing';
import { Button } from'@/components/ui/button';
import { Card, CardContent, CardHeader } from'@/components/ui/card';
import { Select } from'@/components/ui/select';
import { Textarea } from'@/components/ui/textarea';
import {
 formatGoalTarget,
 formatScore,
 getManagerActivePeriod,
 getManagerStatusTone,
 getManagerUomLabel,
 getQuarterBadgeTone,
 getScoreColor,
 QUARTERS,
} from'@/utils/managerHelpers';

const quarterOrder = QUARTERS;

function CheckIns() {
 const queryClient = useQueryClient();
 const activePeriod = getManagerActivePeriod();
 const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
 const [commentDrafts, setCommentDrafts] = useState({});
 const [selectedEmployee, setSelectedEmployee] = useState(null);

 const {
 data: teamCheckIns = [],
 isLoading: checkInsLoading,
 isError: checkInsError,
 } = useQuery({
 queryKey: ['managerTeamCheckIns'],
 queryFn: getTeamCheckIns,
 });

 const commentMutation = useMutation({
 mutationFn: ({ checkinId, comment }) => addManagerComment(checkinId, comment),
 onSuccess: (_, variables) => {
 toast.success('Manager comment saved');
 // Clear the draft for this check-in so the textarea shows the refreshed server value.
 setCommentDrafts((current) => {
  const next = { ...current };
  delete next[variables.checkinId];
  return next;
 });
 queryClient.invalidateQueries({ queryKey: ['managerTeamCheckIns'] });
 },
 onError: (error) => {
 toast.error(error.response?.data?.message || 'Unable to save comment');
 },
 });

 const derivedData = useMemo(() => {
 const teamMembers = teamCheckIns
 .map((item) => item.employee)
 .filter(Boolean);

 const fallbackQuarter = quarterOrder
 .filter((quarter) =>
 teamCheckIns.some((item) =>
 item.goals.some((g) => g.checkins.some((c) => c.quarter === quarter))
)
)
 .pop();

 const displayQuarter = activePeriod.quarter || fallbackQuarter || null;

 const employeeRows = teamCheckIns.map((item) => {
 const member = item.employee;

 const goalCards = item.goals.map(({ goal, checkins }) => {
 const matchingCheckIns = [...checkins].sort((a, b) => {
 const quarterDelta =
 quarterOrder.indexOf(b.quarter) - quarterOrder.indexOf(a.quarter);

 if (quarterDelta !== 0) {
 return quarterDelta;
 }

 return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
 });

 const activeCheckIn = displayQuarter
 ? matchingCheckIns.find((c) => c.quarter === displayQuarter) ||
 matchingCheckIns[0] ||
 null
 : matchingCheckIns[0] || null;

 return {
 goal,
 checkIn: activeCheckIn,
 };
 });

 const validScores = goalCards
 .map((card) => card.checkIn?.progressScore)
 .filter((score) => score !== null && score !== undefined);

 return {
 employeeId: member?._id,
 name: member?.name ||'Unknown',
 department: member?.department,
 goalCards,
 avgProgress: validScores.length
 ? validScores.reduce((sum, score) => sum + Number(score), 0) /
 validScores.length
 : null,
 };
 });

 return {
 teamMembers,
 displayQuarter,
 employeeRows: selectedEmployeeId
 ? employeeRows.filter((row) => row.employeeId === selectedEmployeeId)
 : employeeRows,
 };
 }, [activePeriod.quarter, selectedEmployeeId, teamCheckIns]);

 if (checkInsLoading) {
 return <LoadingSkeleton type="list" rows={4} />;
 }

 if (checkInsError) {
 return (
 <EmptyState
 title="Unable to load team check-ins"
 description="We couldn't fetch the latest team check-in data. Please try again shortly."
 />
);
 }

 return (
 <>
 <div className="space-y-6 p-6 text-gray-900">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 Team Check-ins
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Coach progress quarter by quarter
 </h1>
 </div>

 <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
 <div
 className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getQuarterBadgeTone(activePeriod.quarter)}`}
 >
 <CalendarClock className="size-4" />
 {activePeriod.quarter ||'No active quarter'}
 </div>

 <div className="w-full sm:w-64">
 <Select
 value={selectedEmployeeId}
 onChange={(event) => setSelectedEmployeeId(event.target.value)}
 >
 <option value="">All employees</option>
 {derivedData.teamMembers.map((member) => (
 <option key={member._id} value={member._id}>
 {member.name}
 </option>
))}
 </Select>
 </div>
 </div>
 </div>

 {!activePeriod.quarter && derivedData.displayQuarter ? (
 <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-gray-600">
 No check-in window is active right now. Showing the latest available update for each goal.
 </div>
) : null}

 {derivedData.employeeRows.length ? (
 <div className="space-y-6 p-6 text-gray-900">
 {derivedData.employeeRows.map((employee) => (
 <Card key={employee.employeeId}>
 <CardHeader className="p-6 pb-3">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <button
 type="button"
 className="text-left text-xl font-bold text-gray-900 transition hover:text-blue-600"
 onClick={() =>
 setSelectedEmployee({
 id: employee.employeeId,
 name: employee.name,
 })
 }
 >
 {employee.name}
 </button>
 <div className="mt-1 text-sm text-gray-500">
 {employee.department ||'No department'}
 </div>
 </div>
 <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-gray-700">
 <BarChart3 className="size-4" />
 Avg Progress: {formatScore(employee.avgProgress)}
 </div>
 </div>
 </CardHeader>

 <CardContent className="grid gap-4 p-6 pt-0 xl:grid-cols-2">
 {employee.goalCards.length ? (
 employee.goalCards.map(({ goal, checkIn }) => (
 <div
 key={goal._id}
 className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
 >
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div>
 <div className="text-lg font-bold text-gray-900">{goal.title}</div>
 <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
 <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
 {getManagerUomLabel(goal.uomType)}
 </span>
 <span className="rounded-full bg-slate-200 px-3 py-1 text-gray-700">
 Target: {formatGoalTarget(goal)}
 </span>
 </div>
 </div>

 {checkIn ? (
 <ProgressRing
 score={checkIn.progressScore || 0}
 size={72}
 strokeWidth={7}
 color={getScoreColor(checkIn.progressScore)}
 />
) : null}
 </div>

 {checkIn ? (
 <div className="mt-5 space-y-4">
 <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
 <div>
 <span className="font-semibold text-gray-900">Actual Achievement:</span>{''}
 {checkIn.actualAchievement ??'N/A'}
 </div>
 <div>
 <span className="font-semibold text-gray-900">Quarter:</span>{''}
 {checkIn.quarter}
 </div>
 </div>

 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getManagerStatusTone(checkIn.status)}`}
 >
 {checkIn.status}
 </span>

 <div className="space-y-2">
 <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
 <MessageSquareText className="size-4 text-blue-600" />
 Manager Comment
 </label>
 <Textarea
 rows={4}
 value={commentDrafts[checkIn._id] ?? checkIn.managerComment ??''}
 onChange={(event) =>
 setCommentDrafts((current) => ({
 ...current,
 [checkIn._id]: event.target.value,
 }))
 }
 />
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 disabled={commentMutation.isPending}
 onClick={() =>
 commentMutation.mutate({
 checkinId: checkIn._id,
 comment:
 commentDrafts[checkIn._id] ?? checkIn.managerComment ??'',
 })
 }
 >
 <Save className="size-4" />
 Save Comment
 </Button>
 </div>
 </div>
) : (
 <div className="mt-5">
 <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
 Pending
 </span>
 </div>
)}
 </div>
))
) : (
 <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-gray-600">
 No goals found for this employee yet.
 </div>
)}
 </CardContent>
 </Card>
))}
 </div>
) : (
 <EmptyState
 title="No team check-ins to review"
 description="Once your team members start submitting quarterly updates, they will appear here."
 />
)}
 </div>

 <CheckInSummaryModal
 isOpen={Boolean(selectedEmployee)}
 onClose={() => setSelectedEmployee(null)}
 employeeId={selectedEmployee?.id}
 employeeName={selectedEmployee?.name}
 />
 </>
);
}

export default CheckIns;
