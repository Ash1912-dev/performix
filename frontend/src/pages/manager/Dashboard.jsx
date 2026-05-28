import { useMemo, useState } from'react';
import { useQuery } from'@tanstack/react-query';
import {
 BarChart3,
 CalendarDays,
 Clock3,
 FileCheck2,
 ListChecks,
 MoveRight,
 Send,
 Users,
} from'lucide-react';
import { useNavigate } from'react-router-dom';

import { getTeamCheckIns, getTeamGoals } from'@/api/managerApi';
import CheckInSummaryModal from'@/components/manager/CheckInSummaryModal';
import SharedGoalModal from'@/components/manager/SharedGoalModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import StatCard from'@/components/shared/StatCard';
import { Button } from'@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card';
import { useAuthStore } from'@/store/authStore';
import {
 formatDisplayDate,
 formatScore,
 getGoalSheetQuarterScores,
 getManagerActivePeriod,
 getManagerCurrentDate,
 getManagerStatusTone,
 getScoreTone,
 QUARTERS,
} from'@/utils/managerHelpers';

function Dashboard() {
 const navigate = useNavigate();
 const user = useAuthStore((state) => state.user);
 const [isSharedGoalModalOpen, setIsSharedGoalModalOpen] = useState(false);
 const [selectedEmployee, setSelectedEmployee] = useState(null);
 const activePeriod = getManagerActivePeriod();
 const currentDate = getManagerCurrentDate();

 const { data: goalsData, isLoading: goalsLoading, isError: goalsError } = useQuery({
 queryKey: ['managerTeamGoals'],
 queryFn: getTeamGoals,
 });

 const {
 data: teamCheckIns = [],
 isLoading: checkInsLoading,
 isError: checkInsError,
 } = useQuery({
 queryKey: ['managerTeamCheckIns'],
 queryFn: getTeamCheckIns,
 });

 const dashboardData = useMemo(() => {
 const teamSheets = (goalsData || []).filter((s) => s.status !== 'no-sheet');
 const pendingApprovals = teamSheets.filter((sheet) => sheet.status ==='submitted');
 const approvedSheets = teamSheets.filter((sheet) => sheet.status ==='approved');

 const checkInsDict = teamCheckIns.reduce((acc, item) => {
 const empId = item.employee?._id;
 if (empId) {
 acc[empId] = item;
 }
 return acc;
 }, {});

 const progressRows = teamSheets.map((sheet) => {
 const member = sheet.employee || {};
 const checkInData = checkInsDict[member._id] || { goals: [] };

 const summary = checkInData.goals.map((g) => ({
 goal: g.goal,
 quarters: QUARTERS.map((quarter) => {
 const checkInsForQuarter = g.checkins
 .filter((c) => c.quarter === quarter)
 .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
 const latest = checkInsForQuarter[0];

 return {
 quarter,
 progressScore: latest?.progressScore ?? null,
 };
 }),
 }));

 return {
 employeeId: member._id,
 name: member.name ||'Unknown',
 department: member.department,
 sheetStatus: sheet.status ||'draft',
 totalGoals: sheet.goals?.length || 0,
 quarterScores: getGoalSheetQuarterScores(summary),
 };
 });

 let completedCheckIns = 0;
 if (activePeriod.quarter) {
 teamCheckIns.forEach((item) => {
 item.goals.forEach((g) => {
 const completed = g.checkins.filter(
 (c) => c.quarter === activePeriod.quarter && c.status ==='completed'
).length;
 completedCheckIns += completed;
 });
 });
 }

 return {
 teamSize: teamSheets.length,
 pendingApprovals,
 progressRows,
 approvedCount: approvedSheets.length,
 completedCheckIns,
 };
 }, [activePeriod.quarter, goalsData, teamCheckIns]);

 if (goalsLoading || checkInsLoading) {
 return <LoadingSkeleton type="card" />;
 }

 if (goalsError || checkInsError) {
 return (
 <EmptyState
 title="Unable to load manager dashboard"
 description="We couldn't fetch the latest team data right now. Please refresh and try again."
 />
);
 }

 return (
 <>
 <div className="space-y-6 p-6 text-gray-900">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 Welcome, {user?.name}
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Keep your team aligned and moving
 </h1>
 <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-500">
 <CalendarDays className="size-4 text-blue-600" />
 {currentDate}
 </div>
 </div>

 <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50 px-5 py-4 text-blue-800">
 <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
 Active Cycle Window
 </div>
 <div className="mt-2 text-lg font-bold">
 {activePeriod.period ? activePeriod.period :'No active quarter'}
 </div>
 <div className="mt-1 text-sm text-blue-700/80">
 {activePeriod.windowLabel}
 </div>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <StatCard
 title="Team Size"
 value={dashboardData.teamSize}
 icon={Users}
 color="blue"
 />
 <StatCard
 title="Sheets Pending Approval"
 value={dashboardData.pendingApprovals.length}
 icon={Clock3}
 color="amber"
 />
 <StatCard
 title="Sheets Approved"
 value={dashboardData.approvedCount}
 icon={FileCheck2}
 color="green"
 />
 <StatCard
 title="Check-ins Completed This Quarter"
 value={dashboardData.completedCheckIns}
 icon={Send}
 color="red"
 />
 </div>

 <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
 <Card>
 <CardHeader className="p-6 pb-3">
 <CardTitle className="text-xl">Pending Approvals</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 p-6 pt-0">
 {dashboardData.pendingApprovals.length ? (
 dashboardData.pendingApprovals.map((sheet) => (
 <div
 key={sheet._id}
 className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
 >
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="space-y-2">
 <div>
 <div className="text-lg font-bold text-gray-900">
 {sheet.employee?.name}
 </div>
 <div className="text-sm text-gray-500">
 {sheet.employee?.department ||'No department'}
 </div>
 </div>
 <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
 <div>Submitted: {formatDisplayDate(sheet.submittedAt,'Not submitted')}</div>
 <div>Total Goals: {sheet.goals?.length || 0}</div>
 <div>Total Weightage: {sheet.totalWeightage || 0}%</div>
 </div>
 </div>
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() =>
 navigate(`/manager/team-goals?employee=${sheet.employee?._id}`)
 }
 >
 Review
 <MoveRight className="size-4" />
 </Button>
 </div>
 </div>
))
) : (
 <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-700">
 No goal sheets are waiting for approval right now.
 </div>
)}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="p-6 pb-3">
 <CardTitle className="text-xl">Quick Actions</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 p-6 pt-0">
 <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
 <ListChecks className="size-5" />
 </div>
 <div className="mt-4 text-lg font-bold text-gray-900">Push Shared Goal</div>
 <p className="mt-2 text-sm leading-6 text-gray-500">
 Publish a common priority across your team in one step and keep execution
 aligned.
 </p>
 <Button
 type="button"
 className="mt-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() => setIsSharedGoalModalOpen(true)}
 >
 Push Shared Goal
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>

 <Card>
 <CardHeader className="p-6 pb-3">
 <CardTitle className="text-xl">Team Progress Overview</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {dashboardData.progressRows.length ? (
 <div className="overflow-x-auto rounded-2xl border border-slate-100">
 <table className="min-w-full text-sm">
 <thead>
 <tr className="bg-slate-50 text-left">
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">Goals Status</th>
 {QUARTERS.map((quarter) => (
 <th key={quarter} className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
 {quarter} Score
 </th>
 ))}
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
 </tr>
 </thead>
 <tbody>
 {dashboardData.progressRows.map((row) => (
 <tr
 key={row.employeeId}
 className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
 onClick={() =>
 setSelectedEmployee({
 id: row.employeeId,
 name: row.name,
 })
 }
 >
 <td className="px-6 py-4">
 <div className="font-semibold text-gray-900">{row.name}</div>
 <div className="text-xs text-gray-500">{row.department ||'No department'}</div>
 </td>
 <td className="px-6 py-4">
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getManagerStatusTone(row.sheetStatus)}`}
 >
 {row.sheetStatus}
 </span>
 </td>
 {QUARTERS.map((quarter) => (
 <td key={quarter} className="px-6 py-4">
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getScoreTone(row.quarterScores[quarter])}`}
 >
 {formatScore(row.quarterScores[quarter])}
 </span>
 </td>
))}
 <td className="px-6 py-4">
 <button
 type="button"
 className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
 onClick={(event) => {
 event.stopPropagation();
 setSelectedEmployee({
 id: row.employeeId,
 name: row.name,
 });
 }}
 >
 <BarChart3 className="size-3.5" />
 View Summary
 </button>
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
) : (
 <div className="p-6">
 <EmptyState
 title="No team data yet"
 description="Once your team members start building goals and check-ins, their progress will appear here."
 />
 </div>
)}
 </CardContent>
 </Card>
 </div>

 <SharedGoalModal
 isOpen={isSharedGoalModalOpen}
 onClose={() => setIsSharedGoalModalOpen(false)}
 />
 <CheckInSummaryModal
 isOpen={Boolean(selectedEmployee)}
 onClose={() => setSelectedEmployee(null)}
 employeeId={selectedEmployee?.id}
 employeeName={selectedEmployee?.name}
 />
 </>
);
}

export default Dashboard;
