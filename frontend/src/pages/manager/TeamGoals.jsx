import { useMemo, useState } from'react';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import { ChevronDown, CheckCircle2 } from'lucide-react';
import toast from'react-hot-toast';
import { useSearchParams } from'react-router-dom';

import { approveGoalSheet, getTeamGoals } from'@/api/managerApi';
import InlineGoalEditor from'@/components/manager/InlineGoalEditor';
import ReturnReasonModal from'@/components/manager/ReturnReasonModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import AlertDialog from'@/components/ui/alert-dialog';
import { Button } from'@/components/ui/button';
import { Card, CardContent } from'@/components/ui/card';
import { Select } from'@/components/ui/select';
import {
 formatDisplayDate,
 formatGoalTarget,
 getManagerStatusTone,
 getManagerUomLabel,
} from'@/utils/managerHelpers';

function TeamGoals() {
 const queryClient = useQueryClient();
 const [searchParams] = useSearchParams();
 const highlightedEmployeeId = searchParams.get('employee') ||'';
 const [selectedEmployeeId, setSelectedEmployeeId] = useState(highlightedEmployeeId);
 const [expandedSheets, setExpandedSheets] = useState(
 highlightedEmployeeId ? { [highlightedEmployeeId]: true } : {}
);
 const [approveCandidate, setApproveCandidate] = useState(null);
 const [returnCandidate, setReturnCandidate] = useState(null);

 const { data, isLoading, isError } = useQuery({
 queryKey: ['managerTeamGoals'],
 queryFn: getTeamGoals,
 });

 const approveMutation = useMutation({
 mutationFn: approveGoalSheet,
 onSuccess: () => {
 toast.success('Goal sheet approved successfully');
 queryClient.invalidateQueries({ queryKey: ['managerTeamGoals'] });
 setApproveCandidate(null);
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Unable to approve goal sheet');
 },
 });

 const teamSheets = useMemo(() => (Array.isArray(data) ? data.filter((s) => s.status !== 'no-sheet') : []), [data]);
 const teamMembers = useMemo(
 () =>
 Array.from(
 new Map(
 teamSheets
 .filter((s) => s.employee)
 .map((s) => [s.employee._id, s.employee])
).values()
),
 [teamSheets]
);

 const filteredSheets = useMemo(() => {
 if (!selectedEmployeeId) {
 return teamSheets;
 }

 return teamSheets.filter((sheet) => sheet.employee?._id === selectedEmployeeId);
 }, [teamSheets, selectedEmployeeId]);

 const toggleExpanded = (employeeId) => {
 setExpandedSheets((current) => ({
 ...current,
 [employeeId]: !current[employeeId],
 }));
 };

 if (isLoading) {
 return <LoadingSkeleton type="list" rows={4} />;
 }

 if (isError) {
 return (
 <EmptyState
 title="Unable to load team goal sheets"
 description="We couldn't retrieve team goals right now. Please refresh and try again."
 />
);
 }

 return (
 <>
 <div className="space-y-6 p-6 text-gray-900">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 Team Goal Sheets
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Review submissions and fine-tune goals
 </h1>
 </div>

 <div className="w-full max-w-xs">
 <Select
 value={selectedEmployeeId}
 onChange={(event) => setSelectedEmployeeId(event.target.value)}
 >
 <option value="">All employees</option>
 {teamMembers.map((member) => (
 <option key={member._id} value={member._id}>
 {member.name}
 </option>
))}
 </Select>
 </div>
 </div>

 {filteredSheets.length ? (
 <div className="space-y-4">
 {filteredSheets.map((sheet) => {
 const employeeId = sheet.employee?._id;
 const isExpanded = expandedSheets[employeeId] ?? Boolean(highlightedEmployeeId === employeeId);
 const isSubmitted = sheet.status ==='submitted';
 const isHighlighted = highlightedEmployeeId === employeeId;

 return (
 <Card
 key={sheet._id}
 className={isHighlighted ?'border-blue-300 shadow-[0_18px_50px_-24px_rgba(59,130,246,0.45)]' :''}
 >
 <CardContent className="space-y-5 p-6">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
 <div className="space-y-3">
 <div className="flex flex-wrap items-center gap-3">
 <div>
 <div className="text-xl font-bold text-gray-900">
 {sheet.employee?.name}
 </div>
 <div className="text-sm text-gray-500">
 {sheet.employee?.department ||'No department'}
 </div>
 </div>
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getManagerStatusTone(sheet.status)}`}
 >
 {sheet.status}
 </span>
 </div>

 <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2 xl:grid-cols-3">
 <div>Submitted: {formatDisplayDate(sheet.submittedAt,'Not submitted')}</div>
 <div>Total Weightage: {sheet.totalWeightage || 0}%</div>
 <div>Total Goals: {sheet.goals?.length || 0}</div>
 </div>
 </div>

 <div className="flex flex-wrap gap-3">
 <Button
 type="button"
 variant="outline"
 className="rounded-xl"
 onClick={() => toggleExpanded(employeeId)}
 >
 <ChevronDown
 className={`size-4 transition ${isExpanded ?'rotate-180' :''}`}
 />
 {isExpanded ?'Collapse' :'Expand'}
 </Button>

 {isSubmitted ? (
 <>
 <Button
 type="button"
 className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
 onClick={() =>
 setApproveCandidate({
 id: sheet._id,
 employeeName: sheet.employee?.name,
 })
 }
 >
 <CheckCircle2 className="size-4" />
 Approve
 </Button>
 <Button
 type="button"
 className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
 onClick={() =>
 setReturnCandidate({
 id: sheet._id,
 employeeName: sheet.employee?.name,
 })
 }
 >
 Return for Rework
 </Button>
 </>
) : null}
 </div>
 </div>

 {isExpanded ? (
 <div className="overflow-x-auto rounded-3xl border border-slate-200">
 <table className="min-w-full text-sm">
 <thead className="bg-slate-50 text-left text-gray-500">
 <tr>
 <th className="px-4 py-3 font-semibold">Title</th>
 <th className="px-4 py-3 font-semibold">Thrust Area</th>
 <th className="px-4 py-3 font-semibold">UoM</th>
 <th className="px-4 py-3 font-semibold">Target</th>
 <th className="px-4 py-3 font-semibold">Weightage</th>
 <th className="px-4 py-3 font-semibold">Status</th>
 </tr>
 </thead>
 <tbody>
 {sheet.goals?.map((goal) => (
 <tr key={goal._id} className="border-t border-slate-100 align-top">
 <td className="px-4 py-4 font-medium text-gray-900">{goal.title}</td>
 <td className="px-4 py-4 text-gray-600">{goal.thrustArea}</td>
 <td className="px-4 py-4 text-gray-600">{getManagerUomLabel(goal.uomType)}</td>
 <td className="px-4 py-4 text-gray-600">{formatGoalTarget(goal)}</td>
 <td className="px-4 py-4 text-gray-600">{goal.weightage}%</td>
 <td className="px-4 py-4">
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getManagerStatusTone(goal.status)}`}
 >
 {goal.status}
 </span>
 {isSubmitted ? (
 <div className="mt-4">
 <InlineGoalEditor goal={goal} />
 </div>
) : null}
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
) : null}
 </CardContent>
 </Card>
);
 })}
 </div>
) : (
 <EmptyState
 title="No goal sheets found"
 description="There are no team goal sheets matching the selected filter yet."
 actionLabel="Clear Filter"
 onAction={() => setSelectedEmployeeId('')}
 />
)}
 </div>

 <AlertDialog
 open={Boolean(approveCandidate)}
 onOpenChange={(next) => !next && setApproveCandidate(null)}
 title="Approve Goal Sheet"
 description={`Approve ${approveCandidate?.employeeName ||'this employee'}'s submitted goal sheet? Approved goals will be locked for editing.`}
 actionLabel={approveMutation.isPending ?'Approving...' :'Approve Goal Sheet'}
 onAction={() => approveMutation.mutate(approveCandidate.id)}
 />

 <ReturnReasonModal
 isOpen={Boolean(returnCandidate)}
 onClose={() => setReturnCandidate(null)}
 sheetId={returnCandidate?.id}
 employeeName={returnCandidate?.employeeName}
 />
 </>
);
}

export default TeamGoals;
