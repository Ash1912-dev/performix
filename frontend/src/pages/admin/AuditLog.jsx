import { useState } from'react';
import { useMutation, useQuery } from'@tanstack/react-query';
import {
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 Download,
 Loader2,
 Search,
} from'lucide-react';
import toast from'react-hot-toast';

import { exportAuditLog, getAuditLogs } from'@/api/reportApi';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import { Badge } from'@/components/ui/badge';
import { Button } from'@/components/ui/button';
import { Card, CardContent } from'@/components/ui/card';
import { Input } from'@/components/ui/input';
import { Select } from'@/components/ui/select';
import { downloadFile } from'@/utils/downloadFile';

const CHANGE_TYPE_STYLES = {
 goal_created:'bg-blue-50 text-blue-700',
 goal_updated:'bg-amber-50 text-amber-700',
 sheet_approved:'bg-emerald-50 text-emerald-700',
 sheet_returned:'bg-rose-50 text-rose-700',
 goal_unlocked:'bg-purple-50 text-purple-700',
 checkin_added:'bg-teal-50 text-teal-700',
};

const CHANGE_TYPE_LABELS = {
 goal_created:'Goal Created',
 goal_updated:'Goal Updated',
 sheet_approved:'Sheet Approved',
 sheet_returned:'Sheet Returned',
 goal_unlocked:'Goal Unlocked',
 checkin_added:'Check-in Added',
};

function AuditLogPage() {
 const [page, setPage] = useState(1);
 const [changeType, setChangeType] = useState('');
 const [employeeSearch, setEmployeeSearch] = useState('');
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 const [lockedOnly, setLockedOnly] = useState(false);
 const [expandedRows, setExpandedRows] = useState({});
 const limit = 15;

 const { data, isLoading } = useQuery({
 queryKey: ['auditLogs', { page, changeType, employeeId: employeeSearch, dateFrom, dateTo, lockedOnly }],
 queryFn: () =>
 getAuditLogs({
 page,
 limit,
 ...(changeType && { changeType }),
 ...(employeeSearch && { employeeId: employeeSearch }),
 ...(dateFrom && { dateFrom }),
 ...(dateTo && { dateTo }),
 ...(lockedOnly && { lockedOnly: 'true' }),
 }),
 });

 const logs = data?.data || [];
 const totalPages = data?.pages || 1;

 const exportMutation = useMutation({
 mutationFn: () =>
 exportAuditLog({
 ...(changeType && { changeType }),
 ...(employeeSearch && { employeeId: employeeSearch }),
 ...(dateFrom && { dateFrom }),
 ...(dateTo && { dateTo }),
 ...(lockedOnly && { lockedOnly: 'true' }),
 }),
 onSuccess: (blob) => {
 downloadFile(blob, `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
 toast.success('Audit log exported');
 },
 onError: () => toast.error('Failed to export'),
 });

 const toggleRow = (id) => {
 setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
 };

 // Render a simplified diff for old/new values
 const renderValueDiff = (oldVal, newVal) => {
 if (!oldVal && !newVal) return <span className="text-gray-600">—</span>;

 const parseValue = (val) => {
 if (typeof val ==='string') {
 try { return JSON.parse(val); } catch { return val; }
 }
 return val;
 };

 const old = parseValue(oldVal);
 const updated = parseValue(newVal);

 if (typeof old ==='object' && old !== null) {
 const keys = [...new Set([...Object.keys(old || {}), ...Object.keys(updated || {})])];
 const changedKeys = keys.filter((k) => JSON.stringify(old?.[k]) !== JSON.stringify(updated?.[k]));

 if (changedKeys.length === 0) {
 return <span className="text-xs text-gray-500">No changes</span>;
 }

 return (
 <div className="space-y-1">
 {changedKeys.slice(0, 5).map((key) => (
 <div key={key} className="text-xs">
 <span className="font-semibold text-gray-600">{key}:</span>{''}
 <span className="text-rose-500 line-through">{JSON.stringify(old?.[key]) ||'—'}</span>{''}
 → <span className="text-emerald-600">{JSON.stringify(updated?.[key]) ||'—'}</span>
 </div>
))}
 {changedKeys.length > 5 && (
 <span className="text-xs text-gray-500">+{changedKeys.length - 5} more</span>
)}
 </div>
);
 }

 return (
 <div className="flex items-center gap-2 text-xs">
 <span className="text-rose-500 line-through">{String(old ||'—')}</span>
 <span className="text-gray-600">→</span>
 <span className="text-emerald-600">{String(updated ||'—')}</span>
 </div>
);
 };

 return (
 <div className="space-y-6 p-6 text-gray-900">
 {/* Header */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
 Audit Log
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Track every change across goals, sheets, and check-ins.
 </p>
 </div>
 <Button
 variant="outline"
 className="rounded-xl"
 onClick={() => exportMutation.mutate()}
 disabled={exportMutation.isPending}
 >
 {exportMutation.isPending ? (
 <Loader2 className="size-4 animate-spin" />
) : (
 <Download className="size-4" />
)}
 Export CSV
 </Button>
 </div>

 {/* Filter Bar */}
 <Card>
 <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
 <div className="w-full sm:w-52">
 <Select
 value={changeType}
 onChange={(e) => {
 setChangeType(e.target.value);
 setPage(1);
 }}
 >
 <option value="">All Change Types</option>
 {Object.entries(CHANGE_TYPE_LABELS).map(([val, label]) => (
 <option key={val} value={val}>{label}</option>
))}
 </Select>
 </div>
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
 <Input
 placeholder="Search employee..."
 className="pl-10"
 value={employeeSearch}
 onChange={(e) => {
 setEmployeeSearch(e.target.value);
 setPage(1);
 }}
 />
 </div>
 <Input
 type="date"
 className="w-full sm:w-40"
 value={dateFrom}
 onChange={(e) => {
 setDateFrom(e.target.value);
 setPage(1);
 }}
 placeholder="From"
 />
 <Input
 type="date"
 className="w-full sm:w-40"
 value={dateTo}
 onChange={(e) => {
 setDateTo(e.target.value);
 setPage(1);
 }}
 placeholder="To"
 />
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="lockedOnly"
 checked={lockedOnly}
 onChange={(e) => {
 setLockedOnly(e.target.checked);
 setPage(1);
 }}
 className="size-4 rounded border-gray-300"
 />
 <label htmlFor="lockedOnly" className="text-sm text-gray-600">
 Showing changes made after goal lock date
 </label>
 </div>
 </CardContent>
 </Card>

 {/* Table */}
 {isLoading ? (
 <LoadingSkeleton type="table" rows={8} />
) : logs.length === 0 ? (
 <EmptyState
 title="No audit logs"
 description="No activity matching your filters has been recorded yet."
 />
) : (
 <Card>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100">
 <th className="px-5 py-4 text-left font-semibold text-gray-500">Date / Time</th>
 <th className="px-5 py-4 text-left font-semibold text-gray-500">Changed By</th>
 <th className="hidden px-5 py-4 text-left font-semibold text-gray-500 md:table-cell">Role</th>
 <th className="px-5 py-4 text-left font-semibold text-gray-500">Change Type</th>
 <th className="hidden px-5 py-4 text-left font-semibold text-gray-500 lg:table-cell">Goal Title</th>
 <th className="px-5 py-4 text-left font-semibold text-gray-500">Changes</th>
 <th className="hidden px-5 py-4 text-left font-semibold text-gray-500 xl:table-cell">Description</th>
 <th className="w-12 px-5 py-4" />
 </tr>
 </thead>
 <tbody>
 {logs.map((log) => {
 const isExpanded = expandedRows[log._id];
 return (
 <>
 <tr
 key={log._id}
 className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60"
 >
 <td className="px-5 py-3 text-gray-600">
 <div className="text-sm font-medium text-gray-900">
 {new Date(log.createdAt || log.timestamp).toLocaleDateString()}
 </div>
 <div className="text-xs text-gray-500">
 {new Date(log.createdAt || log.timestamp).toLocaleTimeString()}
 </div>
 </td>
 <td className="px-5 py-3 font-medium text-gray-900">
 {log.changedBy?.name || log.changedByName ||'—'}
 </td>
 <td className="hidden px-5 py-3 md:table-cell">
 <Badge variant={log.changedBy?.role ||'default'}>
 {log.changedBy?.role ||'—'}
 </Badge>
 </td>
 <td className="px-5 py-3">
 <span
 className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
 CHANGE_TYPE_STYLES[log.changeType] ||'bg-slate-100 text-gray-600'
 }`}
 >
 {CHANGE_TYPE_LABELS[log.changeType] || log.changeType}
 </span>
 </td>
 <td className="hidden max-w-[200px] truncate px-5 py-3 text-gray-700 lg:table-cell">
 {log.goalTitle || log.goalId?.title ||'—'}
 </td>
 <td className="px-5 py-3">
 {isExpanded ? (
 renderValueDiff(log.oldValue || log.oldValues, log.newValue || log.newValues)
) : (
 <span className="text-xs text-gray-500">Click to expand</span>
)}
 </td>
 <td className="hidden max-w-[200px] truncate px-5 py-3 text-gray-600 xl:table-cell">
 {log.description ||'—'}
 </td>
 <td className="px-5 py-3">
 <button
 type="button"
 className="rounded-lg p-1.5 text-gray-500 transition hover:bg-slate-100 hover:text-gray-600"
 onClick={() => toggleRow(log._id)}
 >
 <ChevronDown
 className={`size-4 transition-transform ${isExpanded ?'rotate-180' :''}`}
 />
 </button>
 </td>
 </tr>
 {isExpanded && (
 <tr key={`${log._id}-expanded`} className="border-b border-slate-50 bg-slate-50/40">
 <td colSpan={8} className="px-5 py-4">
 <div className="grid gap-4 sm:grid-cols-2">
 <div>
 <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Old Value</p>
 <pre className="max-h-40 overflow-auto rounded-xl bg-white p-3 text-xs text-gray-600">
 {JSON.stringify(
 typeof (log.oldValue || log.oldValues) ==='string'
 ? (() => { try { return JSON.parse(log.oldValue || log.oldValues); } catch { return log.oldValue || log.oldValues; } })()
 : (log.oldValue || log.oldValues || null),
 null,
 2
) ||'—'}
 </pre>
 </div>
 <div>
 <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">New Value</p>
 <pre className="max-h-40 overflow-auto rounded-xl bg-white p-3 text-xs text-gray-600">
 {JSON.stringify(
 typeof (log.newValue || log.newValues) ==='string'
 ? (() => { try { return JSON.parse(log.newValue || log.newValues); } catch { return log.newValue || log.newValues; } })()
 : (log.newValue || log.newValues || null),
 null,
 2
) ||'—'}
 </pre>
 </div>
 </div>
 {log.description && (
 <p className="mt-3 text-sm text-gray-600">
 <span className="font-semibold">Description:</span> {log.description}
 </p>
)}
 </td>
 </tr>
)}
 </>
);
 })}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
 <p className="text-sm text-gray-500">
 Page {page} of {totalPages}
 </p>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 className="rounded-lg"
 disabled={page <= 1}
 onClick={() => setPage((p) => p - 1)}
 >
 <ChevronLeft className="size-4" />
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="rounded-lg"
 disabled={page >= totalPages}
 onClick={() => setPage((p) => p + 1)}
 >
 <ChevronRight className="size-4" />
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
)}
 </div>
);
}

export default AuditLogPage;
