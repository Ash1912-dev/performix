import { useState } from'react';
import { useQuery } from'@tanstack/react-query';
import { ChevronDown, Send, Users } from'lucide-react';

import { getSharedGoals } from'@/api/sharedGoalApi';
import SharedGoalModal from'@/components/manager/SharedGoalModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import { Button } from'@/components/ui/button';
import { Card, CardContent } from'@/components/ui/card';
import {
 formatDisplayDate,
 formatGoalTarget,
 getManagerUomLabel,
} from'@/utils/managerHelpers';

function SharedGoals() {
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [expandedIds, setExpandedIds] = useState({});

 const { data: sharedGoals = [], isLoading, isError } = useQuery({
 queryKey: ['managerSharedGoals'],
 queryFn: getSharedGoals,
 });

 const toggleExpanded = (goalId) => {
 setExpandedIds((current) => ({
 ...current,
 [goalId]: !current[goalId],
 }));
 };

 if (isLoading) {
 return <LoadingSkeleton type="list" rows={4} />;
 }

 if (isError) {
 return (
 <EmptyState
 title="Unable to load shared goals"
 description="We couldn't retrieve your shared goals right now. Please try again in a moment."
 />
);
 }

 return (
 <>
 <div className="space-y-6 p-6 text-gray-900">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
 Shared Goals
 </div>
 <h1 className="m-0 mt-2 text-3xl font-bold tracking-tight text-gray-900">
 Manage the goals you have pushed across the team
 </h1>
 </div>
 <Button
 type="button"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() => setIsModalOpen(true)}
 >
 <Send className="size-4" />
 Push New Shared Goal
 </Button>
 </div>

 {sharedGoals.length ? (
 <div className="space-y-4">
 {sharedGoals.map((goal) => {
 const isExpanded = expandedIds[goal._id];

 return (
 <Card key={goal._id}>
 <CardContent className="space-y-5 p-6">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
 <div className="space-y-3">
 <div>
 <div className="text-xl font-bold text-gray-900">{goal.title}</div>
 <div className="mt-1 text-sm text-gray-500">{goal.thrustArea}</div>
 </div>
 <div className="flex flex-wrap gap-2 text-xs font-semibold">
 <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
 {getManagerUomLabel(goal.uomType)}
 </span>
 <span className="rounded-full bg-slate-100 px-3 py-1 text-gray-700">
 Target: {formatGoalTarget(goal)}
 </span>
 <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
 Pushed to {goal.recipients?.length || 0} employees
 </span>
 </div>
 <div className="text-sm text-gray-500">
 Created {formatDisplayDate(goal.createdAt)}
 </div>
 </div>

 <Button
 type="button"
 variant="outline"
 className="rounded-xl"
 onClick={() => toggleExpanded(goal._id)}
 >
 <ChevronDown
 className={`size-4 transition ${isExpanded ?'rotate-180' :''}`}
 />
 {isExpanded ?'Hide Recipients' :'View Recipients'}
 </Button>
 </div>

 {isExpanded ? (
 <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
 {goal.recipients?.length ? (
 <div className="space-y-3">
 {goal.recipients.map((recipient) => (
 <div
 key={recipient.goalId}
 className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
 >
 <div className="flex items-start gap-3">
 <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
 <Users className="size-4" />
 </div>
 <div>
 <div className="font-semibold text-gray-900">
 {recipient.employee?.name}
 </div>
 <div className="text-sm text-gray-500">
 {recipient.employee?.department ||'No department'}
 </div>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 text-xs font-semibold">
 <span className="rounded-full bg-slate-100 px-3 py-1 text-gray-700">
 Weightage: {recipient.weightage}%
 </span>
 <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
 {recipient.status}
 </span>
 </div>
 </div>
))}
 </div>
) : (
 <div className="text-sm text-gray-600">
 No recipients are linked to this shared goal yet.
 </div>
)}
 </div>
) : null}
 </CardContent>
 </Card>
);
 })}
 </div>
) : (
 <EmptyState
 title="No shared goals pushed yet"
 description="Start by creating one shared goal for your team to keep execution aligned across members."
 actionLabel="Push New Shared Goal"
 onAction={() => setIsModalOpen(true)}
 />
)}
 </div>

 <SharedGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
 </>
);
}

export default SharedGoals;
