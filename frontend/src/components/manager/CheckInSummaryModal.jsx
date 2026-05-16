import { useMemo } from'react';
import { useQuery } from'@tanstack/react-query';
import { Download, FileSpreadsheet } from'lucide-react';

import { getCheckInSummary } from'@/api/managerApi';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import { Button } from'@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from'@/components/ui/dialog';
import {
 buildCheckInSummaryRows,
 formatScore,
 getScoreTone,
 QUARTERS,
} from'@/utils/managerHelpers';

function CheckInSummaryModal({ isOpen, onClose, employeeId, employeeName }) {
 const { data: summary = [], isLoading, isError } = useQuery({
 queryKey: ['managerCheckInSummary', employeeId],
 queryFn: () => getCheckInSummary(employeeId),
 enabled: Boolean(isOpen && employeeId),
 });

 const rows = useMemo(() => buildCheckInSummaryRows(summary), [summary]);

 const handleExport = () => {
 const header = ['Goal Title','Q1 Score','Q2 Score','Q3 Score','Q4 Score','Avg'];
 const csvRows = rows.map((row) => [
 `"${String(row.goalTitle).replaceAll('"','""')}"`,
 row.Q1?.progressScore ??'',
 row.Q2?.progressScore ??'',
 row.Q3?.progressScore ??'',
 row.Q4?.progressScore ??'',
 row.avg ??'',
 ]);
 const csv = [header.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
 const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `${employeeName ||'employee'}-checkin-summary.csv`;
 link.click();
 URL.revokeObjectURL(url);
 };

 return (
 <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
 <DialogContent onOpenChange={(next) => !next && onClose()} className="max-w-6xl">
 <DialogHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div className="space-y-2">
 <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
 <FileSpreadsheet className="size-5" />
 </div>
 <DialogTitle>{employeeName ||'Employee'} Check-in Summary</DialogTitle>
 <DialogDescription>
 Review quarterly scores across all goals and inspect manager comments per
 quarter.
 </DialogDescription>
 </div>
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={handleExport}
 disabled={!rows.length}
 >
 <Download className="size-4" />
 Export CSV
 </Button>
 </DialogHeader>

 {isLoading ? (
 <LoadingSkeleton type="table" rows={4} />
) : isError ? (
 <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
 We couldn't load the check-in summary right now.
 </div>
) : rows.length ? (
 <div className="overflow-x-auto">
 <table className="min-w-full text-sm">
 <thead>
 <tr className="border-b border-slate-200 text-left text-gray-500">
 <th className="px-3 py-3 font-semibold">Goal Title</th>
 {QUARTERS.map((quarter) => (
 <th key={quarter} className="px-3 py-3 font-semibold">
 {quarter} Score
 </th>
))}
 <th className="px-3 py-3 font-semibold">Avg</th>
 </tr>
 </thead>
 <tbody>
 {rows.map((row) => (
 <tr key={row.goalId} className="border-b border-slate-100 align-top">
 <td className="px-3 py-4 font-medium text-gray-900">{row.goalTitle}</td>
 {QUARTERS.map((quarter) => {
 const cell = row[quarter];
 return (
 <td key={quarter} className="px-3 py-4">
 <div className="group relative inline-flex">
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getScoreTone(cell?.progressScore)}`}
 >
 {formatScore(cell?.progressScore)}
 </span>
 {cell?.managerComment ? (
 <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-64 rounded-2xl bg-slate-950 px-3 py-3 text-xs leading-5 text-white shadow-xl group-hover:block">
 {cell.managerComment}
 </div>
) : null}
 </div>
 </td>
);
 })}
 <td className="px-3 py-4">
 <span
 className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getScoreTone(row.avg)}`}
 >
 {formatScore(row.avg)}
 </span>
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
) : (
 <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-gray-600">
 No check-in summary is available for this employee yet.
 </div>
)}
 </DialogContent>
 </Dialog>
);
}

export default CheckInSummaryModal;
