import { useEffect } from'react';
import { useForm } from'react-hook-form';
import { zodResolver } from'@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from'@tanstack/react-query';
import { Loader2, UserPlus, UserCog } from'lucide-react';
import toast from'react-hot-toast';
import { z } from'zod';

import { createUser, getAllUsers, updateUser } from'@/api/adminApi';
import { Button } from'@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from'@/components/ui/dialog';
import { Input } from'@/components/ui/input';
import { Label } from'@/components/ui/label';
import { Select } from'@/components/ui/select';

const createSchema = z.object({
 name: z.string().min(2,'Name must be at least 2 characters'),
 email: z.string().email('Enter a valid email address'),
 password: z.string().min(6,'Password must be at least 6 characters'),
 role: z.enum(['employee','manager','admin']),
 department: z.string().min(1,'Department is required'),
 managerId: z.string().optional(),
});

const editSchema = z.object({
 name: z.string().min(2,'Name must be at least 2 characters'),
 email: z.string().email('Enter a valid email address'),
 role: z.enum(['employee','manager','admin']),
 department: z.string().min(1,'Department is required'),
 managerId: z.string().optional(),
 isActive: z.boolean().optional(),
});

function UserFormModal({ isOpen, onClose, existingUser }) {
 const queryClient = useQueryClient();
 const isEdit = Boolean(existingUser);
 const schema = isEdit ? editSchema : createSchema;

 const {
 register,
 handleSubmit,
 reset,
 watch,
 formState: { errors },
 } = useForm({
 resolver: zodResolver(schema),
 defaultValues: {
 name:'',
 email:'',
 password:'',
 role:'employee',
 department:'',
 managerId:'',
 isActive: true,
 },
 });

 const selectedRole = watch('role');

 const { data: managersData } = useQuery({
 queryKey: ['users', { role:'manager' }],
 queryFn: () => getAllUsers({ role:'manager' }),
 enabled: isOpen && selectedRole ==='employee',
 });

 const managers = Array.isArray(managersData?.data) ? managersData.data : (Array.isArray(managersData) ? managersData : []);

 useEffect(() => {
 if (isOpen && existingUser) {
 reset({
 name: existingUser.name ||'',
 email: existingUser.email ||'',
 role: existingUser.role ||'employee',
 department: existingUser.department ||'',
 managerId: existingUser.managerId?._id || existingUser.managerId ||'',
 isActive: existingUser.isActive !== false,
 });
 } else if (isOpen) {
 reset({
 name:'',
 email:'',
 password:'',
 role:'employee',
 department:'',
 managerId:'',
 isActive: true,
 });
 }
 }, [isOpen, existingUser, reset]);

 const createMutation = useMutation({
 mutationFn: (data) => createUser(data),
 onSuccess: () => {
 queryClient.invalidateQueries(['users']);
 toast.success('User created!');
 onClose();
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed')
 });

 const updateMutation = useMutation({
 mutationFn: ({ id, data }) => updateUser(id, data),
 onSuccess: () => {
 queryClient.invalidateQueries(['users']);
 toast.success('User updated!');
 onClose();
 },
 onError: (err) => toast.error(err.response?.data?.message || 'Failed')
 });

 const onSubmit = (data) => {
  const payload = { ...data };
  if (payload.role !== 'employee') {
    payload.managerId = null;
  }
  if (!payload.managerId) {
    payload.managerId = null;
  }
 if (isEdit) {
 updateMutation.mutate({ id: existingUser._id, data: payload });
 } else {
 createMutation.mutate(payload);
 }
 };

 return (
 <Dialog open={isOpen} onOpenChange={onClose}>
 <DialogContent onOpenChange={onClose} className="max-w-xl">
 <DialogHeader>
 <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
 {isEdit ? <UserCog className="size-5" /> : <UserPlus className="size-5" />}
 </div>
 <DialogTitle>{isEdit ?'Edit User' :'Create New User'}</DialogTitle>
 <DialogDescription>
 {isEdit
 ?'Update the user details below.'
 :'Fill in the details to add a new user to the system.'}
 </DialogDescription>
 </DialogHeader>

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
 <div className="grid gap-5 sm:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="name">Full Name</Label>
 <Input id="name" placeholder="John Doe" {...register('name')} />
 {errors.name && (
 <p className="text-xs text-rose-500">{errors.name.message}</p>
)}
 </div>

 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <Input id="email" type="email" placeholder="john@company.com" {...register('email')} />
 {errors.email && (
 <p className="text-xs text-rose-500">{errors.email.message}</p>
)}
 </div>
 </div>

 {!isEdit && (
 <div className="space-y-2">
 <Label htmlFor="password">Password</Label>
 <Input id="password" type="password" placeholder="Min 6 characters" {...register('password')} />
 {errors.password && (
 <p className="text-xs text-rose-500">{errors.password.message}</p>
)}
 </div>
)}

 <div className="grid gap-5 sm:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="role">Role</Label>
 <Select id="role" {...register('role')}>
 <option value="employee">Employee</option>
 <option value="manager">Manager</option>
 <option value="admin">Admin</option>
 </Select>
 {errors.role && (
 <p className="text-xs text-rose-500">{errors.role.message}</p>
)}
 </div>

 <div className="space-y-2">
 <Label htmlFor="department">Department</Label>
 <Input id="department" placeholder="Engineering" {...register('department')} />
 {errors.department && (
 <p className="text-xs text-rose-500">{errors.department.message}</p>
)}
 </div>
 </div>

 {selectedRole ==='employee' && (
 <div className="space-y-2">
 <Label htmlFor="managerId">Reporting Manager</Label>
 <Select id="managerId" {...register('managerId')}>
 <option value="">Select manager...</option>
 {managers.map((mgr) => (
 <option key={mgr._id} value={mgr._id}>
 {mgr.name} — {mgr.department}
 </option>
))}
 </Select>
 </div>
)}

 {isEdit && (
 <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
 <input
 type="checkbox"
 className="size-4 rounded border-slate-300 accent-blue-600"
 {...register('isActive')}
 />
 <span className="font-medium text-gray-700">Active Account</span>
 </label>
)}

 <DialogFooter>
 <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
 Cancel
 </Button>
 <Button
 type="submit"
 className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
 disabled={createMutation.isPending || updateMutation.isPending}
 >
 {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="size-4 animate-spin" />}
 {isEdit ?'Save Changes' :'Create User'}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
);
}

export default UserFormModal;
