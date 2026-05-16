import { useQuery } from'@tanstack/react-query';
import {
 CalendarDays,
 ClipboardList,
 FileCheck2,
 ShieldAlert,
 Users,
 Trophy,
 TrendingDown,
 ArrowRight,
 Zap,
 ScrollText,
 FileDown,
 UserCog,
} from'lucide-react';
import { Link } from'react-router-dom';

import { getCycleStatus, getCompletionDashboard } from'@/api/adminApi';
import { getOrgOverview } from'@/api/analyticsApi';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import StatCard from'@/components/shared/StatCard';
import { Badge } from'@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card';

function AdminDashboard() {
 const currentDate = new Date().toLocaleDateString(undefined, {
 weekday:'long',
 day:'numeric',
 month:'long',
 year:'numeric',
 });

 const currentYear = new Date().getFullYear();

 const { data: cycleData, isLoading: cycleLoading } = useQuery({
 queryKey: ['cycleStatus'],
 queryFn: getCycleStatus,
 });

 const { data: orgData, isLoading: orgLoading } = useQuery({
 queryKey: ['orgOverview', currentYear],
 queryFn: () => getOrgOverview(currentYear),
 });

 const { data: completionData, isLoading: completionLoading } = useQuery({
 queryKey: ['completionDashboard'],
 queryFn: getCompletionDashboard,
 });

 const isLoading = cycleLoading || orgLoading;

 if (isLoading) {
 return (
 <div className="space-y-6 p-6 text-gray-900">
 <LoadingSkeleton type="card" />
 <LoadingSkeleton type="table" rows={5} />
 </div>
);
 }

 const cycle = cycleData || {};
 const overview = orgData || {};
 const completion = completionData || [];

 const rankBadge = (rank) => {
 if (rank === 1) return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700">🥇 Gold</span>;
 if (rank === 2) return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-gray-600">🥈 Silver</span>;
 if (rank === 3) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">🥉 Bronze</span>;
 return <span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-gray-500">{rank}</span>;
 };

 const quickActions = [
 { label:'Manage Users', icon: UserCog, to:'/admin/users', color:'bg-blue-50 text-blue-600' },
 { label:'View Audit Log', icon: ScrollText, to:'/admin/audit', color:'bg-purple-50 text-purple-600' },
 { label:'Run Escalation', icon: Zap, to:'/admin/escalation', color:'bg-amber-50 text-amber-600' },
 { label:'Export Report', icon: FileDown, to:'/admin/reports', color:'bg-emerald-50 text-emerald-600' },
 ];

 return (
 <div className="space-y-6 p-6 text-gray-900">
 {/* Header */}
 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 Command Center
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Admin Dashboard
 </h1>
 <div className="mt-3 flex items-center gap-4">
 <div className="inline-flex items-center gap-2 text-sm text-gray-500">
 <CalendarDays className="size-4 text-blue-600" />
 {currentDate}
 </div>
 {cycle.activeQuarter && (
 <Badge variant="default" className="bg-emerald-100 text-emerald-700">
 {cycle.activeQuarter} Active
 </Badge>
)}
 </div>
 </div>
 </div>

 {/* Org Overview Stats */}
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <StatCard
 title="Total Employees"
 value={cycle.totalEmployees ?? 0}
 icon={Users}
 color="blue"
 />
 <StatCard
 title="Total Goals Created"
 value={overview.totalGoals ?? 0}
 icon={ClipboardList}
 color="green"
 />
 <StatCard
 title="Sheets Approved"
 value={cycle.approvedSheets ?? 0}
 icon={FileCheck2}
 color="amber"
 />
 <StatCard
 title="Escalations Fired"
 value={overview.escalationsFired ?? 0}
 icon={ShieldAlert}
 color="red"
 />
 </div>

 {/* Current Cycle Status */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <CardTitle className="text-xl">Current Cycle Status</CardTitle>
 </CardHeader>
 <CardContent className="space-y-5 p-6 pt-0">
 <div className="flex flex-wrap gap-3">
 <Badge variant="default" className="bg-blue-100 text-blue-700">
 {cycle.activeQuarter ||'N/A'}
 </Badge>
 <Badge
 variant="default"
 className={cycle.windowOpen
 ?'bg-emerald-100 text-emerald-700'
 :'bg-slate-100 text-gray-600'
 }
 >
 Window {cycle.windowOpen ?'Open' :'Closed'}
 </Badge>
 </div>

 {/* Progress Bars */}
 {[
 { label:'Sheets Submitted', value: cycle.sheetsSubmittedPct || 0, color:'bg-blue-600' },
 { label:'Sheets Approved', value: cycle.sheetsApprovedPct || 0, color:'bg-emerald-600' },
 { label:'Check-ins Completed', value: cycle.checkInsCompletedPct || 0, color:'bg-amber-500' },
 ].map((bar) => (
 <div key={bar.label} className="space-y-2">
 <div className="flex items-center justify-between text-sm">
 <span className="font-medium text-gray-700">{bar.label}</span>
 <span className="font-semibold text-gray-900">{Math.round(bar.value)}%</span>
 </div>
 <div className="h-3 overflow-hidden rounded-full bg-slate-100">
 <div
 className={`h-full rounded-full transition-all duration-700 ${bar.color}`}
 style={{ width: `${Math.min(bar.value, 100)}%` }}
 />
 </div>
 </div>
))}
 </CardContent>
 </Card>

 {/* Top & Bottom Performers */}
 <div className="grid gap-6 xl:grid-cols-2">
 {/* Top Performers */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
 <Trophy className="size-5" />
 </div>
 <CardTitle className="text-xl">Top Performers</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 pt-0">
 {(overview.topPerformers || []).length === 0 ? (
 <p className="py-8 text-center text-sm text-gray-500">No data available yet</p>
) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100 text-left">
 <th className="pb-3 pr-4 font-semibold text-gray-500">Rank</th>
 <th className="pb-3 pr-4 font-semibold text-gray-500">Employee</th>
 <th className="pb-3 pr-4 font-semibold text-gray-500">Department</th>
 <th className="pb-3 text-right font-semibold text-gray-500">Avg Score</th>
 </tr>
 </thead>
 <tbody>
 {(overview.topPerformers || []).map((emp, idx) => (
 <tr key={emp._id || idx} className="border-b border-slate-50 last:border-0">
 <td className="py-3 pr-4">{rankBadge(idx + 1)}</td>
 <td className="py-3 pr-4 font-medium text-gray-900">{emp.name || emp.employeeName}</td>
 <td className="py-3 pr-4 text-gray-600">{emp.department}</td>
 <td className="py-3 text-right">
 <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
 {Math.round(emp.avgScore || 0)}%
 </span>
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
)}
 </CardContent>
 </Card>

 {/* Bottom Performers */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
 <TrendingDown className="size-5" />
 </div>
 <CardTitle className="text-xl">Bottom Performers</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 pt-0">
 {(overview.bottomPerformers || []).length === 0 ? (
 <p className="py-8 text-center text-sm text-gray-500">No data available yet</p>
) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100 text-left">
 <th className="pb-3 pr-4 font-semibold text-gray-500">Rank</th>
 <th className="pb-3 pr-4 font-semibold text-gray-500">Employee</th>
 <th className="pb-3 pr-4 font-semibold text-gray-500">Department</th>
 <th className="pb-3 text-right font-semibold text-gray-500">Avg Score</th>
 </tr>
 </thead>
 <tbody>
 {(overview.bottomPerformers || []).map((emp, idx) => (
 <tr key={emp._id || idx} className="border-b border-slate-50 last:border-0">
 <td className="py-3 pr-4">
 <span className="inline-flex items-center justify-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
 {idx + 1}
 </span>
 </td>
 <td className="py-3 pr-4 font-medium text-gray-900">{emp.name || emp.employeeName}</td>
 <td className="py-3 pr-4 text-gray-600">{emp.department}</td>
 <td className="py-3 text-right">
 <span className={`rounded-full px-3 py-1 text-xs font-bold ${
 (emp.avgScore || 0) < 50
 ?'bg-rose-50 text-rose-700'
 :'bg-amber-50 text-amber-700'
 }`}>
 {Math.round(emp.avgScore || 0)}%
 </span>
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
)}
 </CardContent>
 </Card>
 </div>

 {/* Completion Dashboard Preview */}
 <Card>
 <CardHeader className="flex flex-row items-center justify-between p-6 pb-3">
 <CardTitle className="text-xl">Completion Dashboard</CardTitle>
 <Link
 to="/admin/reports"
 className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
 >
 View Full Report
 <ArrowRight className="size-4" />
 </Link>
 </CardHeader>
 <CardContent className="p-6 pt-0">
 {completionLoading ? (
 <LoadingSkeleton type="table" rows={3} />
) : Array.isArray(completion) && completion.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100 text-left">
 <th className="pb-3 pr-4 font-semibold text-gray-500">Manager Name</th>
 <th className="pb-3 pr-4 font-semibold text-gray-500">Team Size</th>
 <th className="pb-3 pr-4 font-semibold text-gray-500">Check-ins Done</th>
 <th className="pb-3 text-right font-semibold text-gray-500">Pending</th>
 </tr>
 </thead>
 <tbody>
 {completion.slice(0, 5).map((mgr, idx) => (
 <tr key={mgr._id || idx} className="border-b border-slate-50 last:border-0">
 <td className="py-3 pr-4 font-medium text-gray-900">{mgr.managerName || mgr.name}</td>
 <td className="py-3 pr-4 text-gray-600">{mgr.teamSize}</td>
 <td className="py-3 pr-4">
 <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
 {mgr.checkInsDone || mgr.completed || 0}
 </span>
 </td>
 <td className="py-3 text-right">
 <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
 {mgr.pending || 0}
 </span>
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
) : (
 <p className="py-8 text-center text-sm text-gray-500">No completion data available</p>
)}
 </CardContent>
 </Card>

 {/* Quick Actions */}
 <div>
 <h2 className="mb-4 text-xl font-bold text-gray-900">Quick Actions</h2>
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 {quickActions.map((action) => (
 <Link key={action.label} to={action.to}>
 <Card className="group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]">
 <CardContent className="flex items-center gap-4 p-6">
 <div className={`flex size-12 items-center justify-center rounded-2xl ${action.color}`}>
 <action.icon className="size-5" />
 </div>
 <div className="font-semibold text-gray-900 transition group-hover:text-blue-600">
 {action.label}
 </div>
 </CardContent>
 </Card>
 </Link>
))}
 </div>
 </div>
 </div>
);
}

export default AdminDashboard;
