import { useState } from'react';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import {
 ChevronLeft,
 ChevronRight,
 Pencil,
 Plus,
 Search,
 Trash2,
 ToggleLeft,
 ToggleRight,
} from'lucide-react';
import toast from'react-hot-toast';

import { deleteUser, getAllUsers, updateUser } from'@/api/adminApi';
import UserFormModal from'@/components/admin/UserFormModal';
import EmptyState from'@/components/shared/EmptyState';
import LoadingSkeleton from'@/components/shared/LoadingSkeleton';
import AlertDialog from'@/components/ui/alert-dialog';
import { Badge } from'@/components/ui/badge';
import { Button } from'@/components/ui/button';
import { Card, CardContent } from'@/components/ui/card';
import { Input } from'@/components/ui/input';
import { Select } from'@/components/ui/select';

function UsersPage() {
 const queryClient = useQueryClient();
 const [page, setPage] = useState(1);
 const [roleFilter, setRoleFilter] = useState('');
 const [departmentSearch, setDepartmentSearch] = useState('');
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingUser, setEditingUser] = useState(null);
 const [deleteTarget, setDeleteTarget] = useState(null);
 const limit = 10;

 const { data, isLoading } = useQuery({
 queryKey: ['users', { page, role: roleFilter, department: departmentSearch }],
 queryFn: () =>
 getAllUsers({
 page,
 limit,
 ...(roleFilter && { role: roleFilter }),
 ...(departmentSearch && { department: departmentSearch }),
 }),
 });

 const users = data || [];
 const totalPages = Math.ceil((data?.length || 0) / limit) || 1;

 const deleteMutation = useMutation({
 mutationFn: (id) => deleteUser(id),
 onSuccess: () => {
 queryClient.invalidateQueries(['users']);
 toast.success('User deactivated!');
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Failed to deactivate user');
 },
 });

 const toggleMutation = useMutation({
 mutationFn: ({ id, isActive }) => updateUser(id, { isActive }),
 onSuccess: () => {
 toast.success('User status updated');
 queryClient.invalidateQueries({ queryKey: ['users'] });
 },
 onError: (error) => {
 toast.error(error.response?.data?.message ||'Failed to update status');
 },
 });

 const handleEdit = (user) => {
 setEditingUser(user);
 setIsModalOpen(true);
 };

 const handleCloseModal = () => {
 setIsModalOpen(false);
 setEditingUser(null);
 };

 return (
 <div className="space-y-6 p-6 text-gray-900">
 {/* Header */}
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
 User Management
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Manage all users, roles, and department assignments.
 </p>
 </div>
 <Button
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 onClick={() => {
 setEditingUser(null);
 setIsModalOpen(true);
 }}
 >
 <Plus className="size-4" />
 Add User
 </Button>
 </div>

 {/* Filter Bar */}
 <Card>
 <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500" />
 <Input
 placeholder="Search by department..."
 className="pl-10"
 value={departmentSearch}
 onChange={(e) => {
 setDepartmentSearch(e.target.value);
 setPage(1);
 }}
 />
 </div>
 <div className="w-full sm:w-48">
 <Select
 value={roleFilter}
 onChange={(e) => {
 setRoleFilter(e.target.value);
 setPage(1);
 }}
 >
 <option value="">All Roles</option>
 <option value="employee">Employee</option>
 <option value="manager">Manager</option>
 <option value="admin">Admin</option>
 </Select>
 </div>
 </CardContent>
 </Card>

 {/* Table */}
 {isLoading ? (
 <LoadingSkeleton type="table" rows={6} />
) : users.length === 0 ? (
 <EmptyState
 title="No users found"
 description="Try adjusting your filters, or add a new user to get started."
 actionLabel="Add User"
 onAction={() => {
 setEditingUser(null);
 setIsModalOpen(true);
 }}
 />
) : (
 <Card>
 <CardContent className="p-0">
 <div className="overflow-x-auto rounded-2xl">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-100">
 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Email</th>
 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Role</th>
 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Department</th>
 <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 lg:table-cell">Manager</th>
 <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
 <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
 </tr>
 </thead>
 <tbody>
 {users.map((user) => (
 <tr
 key={user._id}
 className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60"
 >
 <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
 <td className="px-6 py-4 text-gray-600">{user.email}</td>
 <td className="px-6 py-4">
 <Badge variant={user.role}>{user.role}</Badge>
 </td>
 <td className="px-6 py-4 text-gray-600">{user.department}</td>
 <td className="hidden px-6 py-4 text-gray-600 lg:table-cell">
 {user.managerId?.name ||'—'}
 </td>
 <td className="px-6 py-4">
 <span
 className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
 user.isActive !== false
 ?'bg-emerald-50 text-emerald-700'
 :'bg-slate-100 text-gray-500'
 }`}
 >
 {user.isActive !== false ?'Active' :'Inactive'}
 </span>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
 title="Edit"
 onClick={() => handleEdit(user)}
 >
 <Pencil className="size-4" />
 </button>
 <button
 type="button"
 className="rounded-lg p-2 text-gray-500 transition hover:bg-amber-50 hover:text-amber-600"
 title={user.isActive !== false ?'Deactivate' :'Activate'}
 onClick={() =>
 toggleMutation.mutate({
 id: user._id,
 isActive: user.isActive === false,
 })
 }
 >
 {user.isActive !== false ? (
 <ToggleRight className="size-4" />
) : (
 <ToggleLeft className="size-4" />
)}
 </button>
 <button
 type="button"
 className="rounded-lg p-2 text-gray-500 transition hover:bg-rose-50 hover:text-rose-600"
 title="Delete"
 onClick={() => {
   if (window.confirm('Delete this user?')) deleteMutation.mutate(user._id);
 }}
 disabled={deleteMutation.isPending}
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

 {/* Modals */}
 <UserFormModal
 isOpen={isModalOpen}
 onClose={handleCloseModal}
 existingUser={editingUser}
 />

 <AlertDialog
 open={Boolean(deleteTarget)}
 onOpenChange={() => setDeleteTarget(null)}
 title="Delete User"
 description={`Are you sure you want to permanently delete ${deleteTarget?.name}? This action cannot be undone.`}
 actionLabel="Delete"
 onAction={() => deleteMutation.mutate(deleteTarget._id)}
 destructive
 />
 </div>
);
}

export default UsersPage;
