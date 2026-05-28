import { useState } from'react';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import {
 ChevronLeft,
 ChevronRight,
 CheckCircle2,
 Loader2,
 Pencil,
 Plus,
 ShieldAlert,
 Trash2,
 Zap,
} from'lucide-react';
import toast from'react-hot-toast';

import {
 deleteRule,
 getEscalationLogs,
 getRules,
 resolveEscalation,
 runEscalationManually,
 updateRule,
} from'@/api/escalationApi';
import EscalationRuleModal from'@/components/admin/EscalationRuleModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import AlertDialog from'@/components/ui/alert-dialog';
import { Badge } from'@/components/ui/badge';
import { Button } from'@/components/ui/button';
import { Card, CardContent } from'@/components/ui/card';
import { Select } from'@/components/ui/select';

const TRIGGER_LABELS = {
 goal_not_submitted:'Goal Not Submitted',
 goal_not_approved:'Goal Not Approved',
 checkin_not_completed:'Check-in Incomplete',
};

function EscalationPage() {
 const queryClient = useQueryClient();
 const [activeTab, setActiveTab] = useState('rules');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingRule, setEditingRule] = useState(null);
 const [deleteTarget, setDeleteTarget] = useState(null);

 // Logs filters
 const [logPage, setLogPage] = useState(1);
 const [logTriggerFilter, setLogTriggerFilter] = useState('');
 const [logResolvedFilter, setLogResolvedFilter] = useState('');
 const logLimit = 10;

 // Rules
 const { data: rulesData, isLoading: rulesLoading } = useQuery({
 queryKey: ['escalationRules'],
 queryFn: getRules,
 });

 // Logs
 const { data: logsData, isLoading: logsLoading } = useQuery({
 queryKey: ['escalationLogs', { page: logPage, triggerType: logTriggerFilter, resolved: logResolvedFilter }],
 queryFn: () =>
 getEscalationLogs({
 page: logPage,
 limit: logLimit,
 ...(logTriggerFilter && { triggerType: logTriggerFilter }),
 ...(logResolvedFilter && { resolved: logResolvedFilter }),
 }),
 enabled: activeTab ==='logs',
 });

 const rules = rulesData || [];
 const logs = logsData || [];
 const logTotalPages = logsData?.pages || 1;

 // Mutations
 const toggleRuleMutation = useMutation({
 mutationFn: ({ id, isActive }) => updateRule(id, { isActive }),
 onSuccess: () => {
 toast.success('Rule status toggled');
 queryClient.invalidateQueries({ queryKey: ['escalationRules'] });
 },
 onError: (err) => toast.error(err.response?.data?.message ||'Failed to update rule'),
 });

 const deleteRuleMutation = useMutation({
 mutationFn: (id) => deleteRule(id),
 onSuccess: () => {
 toast.success('Rule deleted');
 queryClient.invalidateQueries({ queryKey: ['escalationRules'] });
 setDeleteTarget(null);
 },
 onError: (err) => toast.error(err.response?.data?.message ||'Failed to delete rule'),
 });

 const resolveMutation = useMutation({
 mutationFn: (id) => resolveEscalation(id),
 onSuccess: () => {
 toast.success('Escalation resolved');
 queryClient.invalidateQueries({ queryKey: ['escalationLogs'] });
 },
 onError: (err) => toast.error(err.response?.data?.message ||'Failed to resolve'),
 });

 const runMutation = useMutation({
 mutationFn: runEscalationManually,
 onSuccess: (data) => {
 toast.success(data?.message ||'Escalation run completed');
 queryClient.invalidateQueries({ queryKey: ['escalationLogs'] });
 },
 onError: (err) => toast.error(err.response?.data?.message ||'Escalation run failed'),
 });

 const handleEditRule = (rule) => {
 setEditingRule(rule);
 setIsModalOpen(true);
 };

 const handleCloseModal = () => {
 setIsModalOpen(false);
 setEditingRule(null);
 };

 const tabs = [
 { id:'rules', label:'Rules', icon: ShieldAlert },
 { id:'logs', label:'Logs', icon: Zap },
 ];

 return (
 <div className="space-y-6 p-6 text-gray-900">
 {/* Header */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
 Escalation Management
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Configure triggers, review escalation history, and take action.
 </p>
 </div>
 <Button
 className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
 onClick={() => runMutation.mutate()}
 disabled={runMutation.isPending}
 >
 {runMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
 Run Escalation Now
 </Button>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 type="button"
 className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
 activeTab === tab.id
 ?'bg-white text-gray-900 shadow-sm'
 :'text-gray-500 hover:text-gray-700'
 }`}
 onClick={() => setActiveTab(tab.id)}
 >
 <tab.icon className="size-4" />
 {tab.label}
 </button>
))}
 </div>

 {/* Rules Tab */}
 {activeTab ==='rules' && (
 <div className="space-y-4">
 <div className="flex justify-end">
 <Button
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() => {
 setEditingRule(null);
 setIsModalOpen(true);
 }}
 >
 <Plus className="size-4" />
 Add Rule
 </Button>
 </div>

 {rulesLoading ? (
 <LoadingSkeleton type="table" rows={4} />
) : rules.length === 0 ? (
 <EmptyState
 title="No escalation rules"
 description="Create your first escalation rule to automate follow-ups."
 actionLabel="Add Rule"
 onAction={() => {
 setEditingRule(null);
 setIsModalOpen(true);
 }}
 />
) : (
 <Card>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100">
 <th className="px-6 py-4 text-left font-semibold text-slate-600">Name</th>
 <th className="px-6 py-4 text-left font-semibold text-slate-600">Trigger Type</th>
 <th className="px-6 py-4 text-center font-semibold text-slate-600">Days</th>
 <th className="px-6 py-4 text-left font-semibold text-slate-600">Chain</th>
 <th className="px-6 py-4 text-center font-semibold text-slate-600">Active</th>
 <th className="px-6 py-4 text-right font-semibold text-slate-600">Actions</th>
 </tr>
 </thead>
 <tbody>
 {rules.map((rule) => (
 <tr
 key={rule._id}
 className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60"
 >
 <td className="px-6 py-4 font-medium text-gray-900">{rule.name}</td>
 <td className="px-6 py-4">
 <Badge variant="default" className="bg-amber-50 text-amber-700">
 {TRIGGER_LABELS[rule.triggerType] || rule.triggerType}
 </Badge>
 </td>
 <td className="px-6 py-4 text-center font-semibold text-gray-700">{rule.daysThreshold}</td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-1.5">
 {(rule.escalationChain || []).map((role) => (
 <Badge key={role} variant={role}>
 {role}
 </Badge>
))}
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <button
 type="button"
 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
 rule.isActive ?'bg-emerald-500' :'bg-slate-200'
 }`}
 onClick={() =>
 toggleRuleMutation.mutate({
 id: rule._id,
 isActive: !rule.isActive,
 })
 }
 >
 <span
 className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${
 rule.isActive ?'translate-x-6' :'translate-x-1'
 }`}
 />
 </button>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
 title="Edit"
 onClick={() => handleEditRule(rule)}
 >
 <Pencil className="size-4" />
 </button>
 <button
 type="button"
 className="rounded-lg p-2 text-gray-500 transition hover:bg-rose-50 hover:text-rose-600"
 title="Delete"
 onClick={() => setDeleteTarget(rule)}
 >
 <Trash2 className="size-4" />
 </button>
 </div>
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
)}
 </div>
)}

 {/* Logs Tab */}
 {activeTab ==='logs' && (
 <div className="space-y-4">
 {/* Filters */}
 <Card>
 <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
 <div className="w-full sm:w-52">
 <Select
 value={logTriggerFilter}
 onChange={(e) => {
 setLogTriggerFilter(e.target.value);
 setLogPage(1);
 }}
 >
 <option value="">All Trigger Types</option>
 <option value="goal_not_submitted">Goal Not Submitted</option>
 <option value="goal_not_approved">Goal Not Approved</option>
 <option value="checkin_not_completed">Check-in Incomplete</option>
 </Select>
 </div>
 <div className="w-full sm:w-40">
 <Select
 value={logResolvedFilter}
 onChange={(e) => {
 setLogResolvedFilter(e.target.value);
 setLogPage(1);
 }}
 >
 <option value="">All Status</option>
 <option value="true">Resolved</option>
 <option value="false">Unresolved</option>
 </Select>
 </div>
 </CardContent>
 </Card>

 {logsLoading ? (
 <LoadingSkeleton type="table" rows={5} />
) : logs.length === 0 ? (
 <EmptyState
 title="No escalation logs"
 description="No escalations have been triggered yet."
 />
) : (
 <Card>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-slate-100">
 <th className="px-6 py-4 text-left font-semibold text-slate-600">Employee</th>
 <th className="px-6 py-4 text-left font-semibold text-slate-600">Trigger Type</th>
 <th className="hidden px-6 py-4 text-left font-semibold text-slate-600 md:table-cell">Escalated To</th>
 <th className="hidden px-6 py-4 text-left font-semibold text-slate-600 lg:table-cell">Message</th>
 <th className="px-6 py-4 text-left font-semibold text-slate-600">Sent At</th>
 <th className="px-6 py-4 text-center font-semibold text-slate-600">Resolved</th>
 <th className="px-6 py-4 text-right font-semibold text-slate-600">Actions</th>
 </tr>
 </thead>
 <tbody>
 {logs.map((log) => (
 <tr
 key={log._id}
 className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60"
 >
 <td className="px-6 py-4 font-medium text-gray-900">
 {log.employeeId?.name || log.employeeName ||'—'}
 </td>
 <td className="px-6 py-4">
 <Badge variant="default" className="bg-amber-50 text-amber-700">
 {TRIGGER_LABELS[log.triggerType] || log.triggerType}
 </Badge>
 </td>
 <td className="hidden px-6 py-4 text-gray-600 md:table-cell">
 {log.escalatedTo?.name || log.escalatedToName ||'—'}
 </td>
 <td className="hidden max-w-xs truncate px-6 py-4 text-gray-600 lg:table-cell">
 {log.message ||'—'}
 </td>
 <td className="px-6 py-4 text-gray-600">
 {log.sentAt || log.createdAt
 ? new Date(log.sentAt || log.createdAt).toLocaleDateString()
 :'—'}
 </td>
 <td className="px-6 py-4 text-center">
 {log.resolved ? (
 <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
 Yes
 </span>
) : (
 <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
 No
 </span>
)}
 </td>
 <td className="px-6 py-4 text-right">
 {!log.resolved && (
 <Button
 variant="outline"
 size="sm"
 className="rounded-lg text-xs"
 onClick={() => resolveMutation.mutate(log._id)}
 disabled={resolveMutation.isPending}
 >
 <CheckCircle2 className="size-3.5" />
 Resolve
 </Button>
)}
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
 <p className="text-sm text-gray-500">
 Page {logPage} of {logTotalPages}
 </p>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 className="rounded-lg"
 disabled={logPage <= 1}
 onClick={() => setLogPage((p) => p - 1)}
 >
 <ChevronLeft className="size-4" />
 </Button>
 <Button
 variant="outline"
 size="sm"
 className="rounded-lg"
 disabled={logPage >= logTotalPages}
 onClick={() => setLogPage((p) => p + 1)}
 >
 <ChevronRight className="size-4" />
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
)}
 </div>
)}

 {/* Modals */}
 <EscalationRuleModal
 isOpen={isModalOpen}
 onClose={handleCloseModal}
 existingRule={editingRule}
 />

 <AlertDialog
 open={Boolean(deleteTarget)}
 onOpenChange={() => setDeleteTarget(null)}
 title="Delete Escalation Rule"
 description={`Are you sure you want to delete"${deleteTarget?.name}"? This cannot be undone.`}
 actionLabel="Delete"
 onAction={() => deleteRuleMutation.mutate(deleteTarget._id)}
 destructive
 />
 </div>
);
}

export default EscalationPage;
