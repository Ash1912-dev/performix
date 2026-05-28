import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getAllGoals, unlockGoal } from '@/api/adminApi';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import AlertDialog from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

function GoalsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [nameSearch, setNameSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unlockTarget, setUnlockTarget] = useState(null);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['adminGoals', { page, name: nameSearch, department: departmentFilter, status: statusFilter }],
    queryFn: () =>
      getAllGoals({
        page,
        limit,
        ...(nameSearch && { name: nameSearch }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(statusFilter && { status: statusFilter }),
      }),
  });

  const unlockMutation = useMutation({
    mutationFn: (goalId) => unlockGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminGoals']);
      toast.success('Goal unlocked successfully!');
    },
    onError: () => toast.error('Failed to unlock goal')
  });

  const goals = data?.data ?? [];
  const totalPages = data?.pages ?? 1;

  const statusColors = {
    draft: 'bg-slate-100 text-gray-600',
    submitted: 'bg-blue-50 text-blue-700',
    approved: 'bg-emerald-50 text-emerald-700',
    returned: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="space-y-6 p-6 text-gray-900">
      {/* Header */}
      <div>
        <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
          Goal Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Oversee all goals across the organization. Unlock locked goals when needed.
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search by employee name..."
              className="pl-10"
              value={nameSearch}
              onChange={(e) => {
                setNameSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Input
            placeholder="Department"
            className="w-full sm:w-44"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
          />
          <div className="w-full sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="returned">Returned</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : goals.length === 0 ? (
        <EmptyState
          title="No goals found"
          description="Adjust the filters or wait for employees to create goals."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Employee</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Goal Title</th>
                    <th className="hidden px-6 py-4 text-left font-semibold text-slate-600 md:table-cell">Thrust Area</th>
                    <th className="hidden px-6 py-4 text-left font-semibold text-slate-600 lg:table-cell">UoM</th>
                    <th className="hidden px-6 py-4 text-center font-semibold text-slate-600 lg:table-cell">Weightage</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-600">Locked</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((goal) => (
                    <tr
                      key={goal._id}
                      className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{goal.employeeId?.name ?? '—'}</div>
                        <div className="text-xs text-gray-500">{goal.employeeId?.department ?? '—'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{goal.title}</td>
                      <td className="hidden px-6 py-4 text-gray-600 md:table-cell">{goal.thrustArea}</td>
                      <td className="hidden px-6 py-4 text-gray-600 lg:table-cell">{goal.uomType}</td>
                      <td className="hidden px-6 py-4 text-center text-gray-700 lg:table-cell">{goal.weightage}%</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusColors[goal.status] || statusColors.draft}`}>
                          {goal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {goal.isLocked ? (
                          <Lock className="mx-auto size-4 text-amber-500" />
                        ) : (
                          <LockOpen className="mx-auto size-4 text-emerald-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {goal.isLocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs"
                            onClick={() => {
                              if (window.confirm('Unlock this goal? Employee can edit it again.')) {
                                unlockMutation.mutate(goal._id);
                              }
                            }}
                            disabled={unlockMutation.isPending}
                          >
                            <LockOpen className="size-3.5" />
                            {unlockMutation.isPending ? 'Unlocking...' : 'Unlock'}
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

      {/* Unlock Confirm Dialog */}
      <AlertDialog
        open={Boolean(unlockTarget)}
        onOpenChange={() => setUnlockTarget(null)}
        title="Unlock Goal"
        description="This will allow the employee to edit this goal. Continue?"
        actionLabel="Unlock"
        onAction={() => unlockMutation.mutate(unlockTarget._id)}
      />
    </div>
  );
}

export default GoalsPage;
