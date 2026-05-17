import { useState } from'react';
import { useMutation, useQuery } from'@tanstack/react-query';
import {
 Download,
 FileSpreadsheet,
 Loader2,
 ScrollText,
 Search,
} from'lucide-react';
import toast from'react-hot-toast';

import {
 exportAchievementReport,
 exportAchievementCSV,
 exportAuditLog,
 getAchievementReport,
 getManagerEffectiveness,
} from'@/api/reportApi';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import { Button } from'@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card';
import { Input } from'@/components/ui/input';
import { Select } from'@/components/ui/select';
import { downloadFile } from'@/utils/downloadFile';

function ReportsPage() {
 const [cycleYear, setCycleYear] = useState(new Date().getFullYear().toString());
 const [quarter, setQuarter] = useState('');
 const [department, setDepartment] = useState('');
 const [reportGenerated, setReportGenerated] = useState(false);

 // Achievement report
 const {
 data: reportData,
 isLoading: reportLoading,
 refetch: refetchReport,
 } = useQuery({
 queryKey: ['achievementReport', { cycleYear, quarter, department }],
 queryFn: () =>
 getAchievementReport({
 cycleYear,
 ...(quarter && { quarter }),
 ...(department && { department }),
 }),
 enabled: reportGenerated,
 });

 // Manager effectiveness
 const { data: effectivenessData, isLoading: effectivenessLoading } = useQuery({
 queryKey: ['managerEffectiveness'],
 queryFn: getManagerEffectiveness,
 });

 // Export mutations
 const exportReportMutation = useMutation({
 mutationFn: () =>
 exportAchievementReport({
 cycleYear,
 ...(quarter && { quarter }),
 ...(department && { department }),
 }),
 onSuccess: (blob) => {
 downloadFile(blob, `achievement_report_${cycleYear}.xlsx`);
 toast.success('Report exported successfully');
 },
 onError: () => toast.error('Failed to export report'),
 });

 const exportCSVMutation = useMutation({
  mutationFn: () =>
  exportAchievementCSV({
  cycleYear,
  ...(quarter && { quarter }),
  ...(department && { department }),
  }),
  onSuccess: (blob) => {
  downloadFile(blob, `achievement_report_${cycleYear}.csv`);
  toast.success('CSV Report exported successfully');
  },
  onError: () => toast.error('Failed to export CSV report'),
  });

 const exportAuditMutation = useMutation({
 mutationFn: () => exportAuditLog({}),
 onSuccess: (blob) => {
 downloadFile(blob, `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
 toast.success('Audit log exported');
 },
 onError: () => toast.error('Failed to export audit log'),
 });

 const handleGenerate = () => {
 setReportGenerated(true);
 refetchReport();
 };

 const report = reportData || [];
 const managers = effectivenessData || [];

 // Sort managers by check-in rate descending
 const sortedManagers = [...managers].sort(
 (a, b) => (b.checkInRate || b.checkInRatePct || 0) - (a.checkInRate || a.checkInRatePct || 0)
);

 const scoreColor = (score) => {
 if (score >= 80) return'text-emerald-700 bg-emerald-50';
 if (score >= 50) return'text-amber-700 bg-amber-50';
 return'text-rose-700 bg-rose-50';
 };

 const rateColor = (rate) => {
 if (rate >= 80) return'text-emerald-700';
 if (rate >= 50) return'text-amber-700';
 return'text-rose-700';
 };

 return (
 <div className="space-y-8 p-6 text-gray-900">
 {/* Header */}
 <div>
 <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
 Reports & Exports
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Generate achievement reports, compare managers, and export data.
 </p>
 </div>

 {/* Section 1: Achievement Report */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
 <FileSpreadsheet className="size-5" />
 </div>
 <CardTitle className="text-xl">Achievement Report</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="space-y-5 p-6 pt-0">
 {/* Filters */}
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cycle Year</label>
 <Select value={cycleYear} onChange={(e) => setCycleYear(e.target.value)}>
 <option value="2024">2024</option>
 <option value="2025">2025</option>
 <option value="2026">2026</option>
 </Select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quarter</label>
 <Select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
 <option value="">All Quarters</option>
 <option value="Q1">Q1</option>
 <option value="Q2">Q2</option>
 <option value="Q3">Q3</option>
 <option value="Q4">Q4</option>
 </Select>
 </div>
 <div className="relative space-y-1.5">
 <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Department</label>
 <Input
 placeholder="All departments"
 value={department}
 onChange={(e) => setDepartment(e.target.value)}
 />
 </div>
 <Button
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={handleGenerate}
 >
 <Search className="size-4" />
 Generate Report
 </Button>
 </div>

 {/* Results */}
 {reportLoading ? (
 <LoadingSkeleton type="table" rows={5} />
 ) : reportGenerated && report.length === 0 ? (
        <EmptyState
          title="No results found"
          description="No results found for the selected filters. Try adjusting your cycle year, quarter, or department."
        />
) : report.length > 0 ? (
 <>
 <div className="overflow-x-auto rounded-2xl border border-slate-100">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100 bg-slate-50/60">
 <th className="px-4 py-3 text-left font-semibold text-gray-500">Employee</th>
 <th className="px-4 py-3 text-left font-semibold text-gray-500">Department</th>
 <th className="px-4 py-3 text-left font-semibold text-gray-500">Goal Title</th>
 <th className="hidden px-4 py-3 text-left font-semibold text-gray-500 md:table-cell">Thrust Area</th>
 <th className="hidden px-4 py-3 text-left font-semibold text-gray-500 lg:table-cell">UoM</th>
 <th className="hidden px-4 py-3 text-right font-semibold text-gray-500 lg:table-cell">Planned</th>
 <th className="hidden px-4 py-3 text-right font-semibold text-gray-500 lg:table-cell">Actual</th>
 <th className="px-4 py-3 text-right font-semibold text-gray-500">Score %</th>
 <th className="px-4 py-3 text-left font-semibold text-gray-500">Status</th>
 <th className="hidden px-4 py-3 text-left font-semibold text-gray-500 md:table-cell">Quarter</th>
 </tr>
 </thead>
 <tbody>
 {report.map((row, idx) => {
 const score = Math.round(row.progressScore || row.scorePct || 0);
 return (
 <tr key={idx} className="border-b border-slate-50 last:border-0">
 <td className="px-4 py-3 font-medium text-gray-900">{row.employeeName || row.employee}</td>
 <td className="px-4 py-3 text-gray-600">{row.department}</td>
 <td className="px-4 py-3 text-gray-900">{row.goalTitle || row.title}</td>
 <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{row.thrustArea}</td>
 <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{row.uomType || row.uom}</td>
 <td className="hidden px-4 py-3 text-right text-gray-700 lg:table-cell">{row.plannedTarget ??'—'}</td>
 <td className="hidden px-4 py-3 text-right text-gray-700 lg:table-cell">{row.actualAchievement ??'—'}</td>
 <td className="px-4 py-3 text-right">
 <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor(score)}`}>
 {score}%
 </span>
 </td>
 <td className="px-4 py-3">
 <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
 {row.status}
 </span>
 </td>
 <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{row.quarter}</td>
 </tr>
);
 })}
 </tbody>
 </table>
 </div>

 {/* Export Buttons */}
 <div className="flex flex-wrap gap-3">
 <Button
 variant="outline"
 className="rounded-xl"
 onClick={() => exportReportMutation.mutate()}
 disabled={exportReportMutation.isPending}
 >
 {exportReportMutation.isPending ? (
 <Loader2 className="size-4 animate-spin" />
) : (
 <Download className="size-4" />
)}
 Export Excel
 </Button>
 <Button
 variant="outline"
 className="rounded-xl"
 onClick={() => exportCSVMutation.mutate()}
 disabled={exportCSVMutation.isPending}
 >
 {exportCSVMutation.isPending ? (
 <Loader2 className="size-4 animate-spin" />
) : (
 <Download className="size-4" />
)}
 Export CSV
 </Button>
 <Button
 variant="outline"
 className="rounded-xl"
 onClick={() => exportAuditMutation.mutate()}
 disabled={exportAuditMutation.isPending}
 >
 {exportAuditMutation.isPending ? (
 <Loader2 className="size-4 animate-spin" />
) : (
 <ScrollText className="size-4" />
)}
 Export Audit Log
 </Button>
 </div>
 </>
) : null}
 </CardContent>
 </Card>

 {/* Section 2: Manager Effectiveness */}
 <Card>
 <CardHeader className="p-6 pb-3">
 <div className="flex items-center gap-3">
 <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
 <ScrollText className="size-5" />
 </div>
 <CardTitle className="text-xl">Manager Effectiveness</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="p-6 pt-0">
 {effectivenessLoading ? (
 <LoadingSkeleton type="table" rows={4} />
) : sortedManagers.length === 0 ? (
 <p className="py-8 text-center text-sm text-gray-500">No manager data available</p>
) : (
 <div className="overflow-x-auto rounded-2xl border border-slate-100">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100 bg-slate-50/60">
 <th className="px-4 py-3 text-left font-semibold text-gray-500">Manager Name</th>
 <th className="px-4 py-3 text-center font-semibold text-gray-500">Team Size</th>
 <th className="px-4 py-3 text-right font-semibold text-gray-500">Check-in Rate %</th>
 <th className="px-4 py-3 text-right font-semibold text-gray-500">Avg Team Score</th>
 </tr>
 </thead>
 <tbody>
 {sortedManagers.map((mgr, idx) => {
 const rate = Math.round(mgr.checkInRate || mgr.checkInRatePct || 0);
 return (
 <tr key={mgr._id || idx} className="border-b border-slate-50 last:border-0">
 <td className="px-4 py-3 font-medium text-gray-900">{mgr.managerName || mgr.name}</td>
 <td className="px-4 py-3 text-center text-gray-600">{mgr.teamSize}</td>
 <td className={`px-4 py-3 text-right font-semibold ${rateColor(rate)}`}>
 {rate}%
 </td>
 <td className="px-4 py-3 text-right text-gray-700">
 {Math.round(mgr.avgTeamScore || mgr.avgScore || 0)}%
 </td>
 </tr>
);
 })}
 </tbody>
 </table>
 </div>
)}
 </CardContent>
 </Card>
 </div>
);
}

export default ReportsPage;
