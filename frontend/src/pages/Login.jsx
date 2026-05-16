import { useEffect } from'react';
import { useNavigate } from'react-router-dom';
import { zodResolver } from'@hookform/resolvers/zod';
import { useMutation } from'@tanstack/react-query';
import { Loader2, LockKeyhole, ShieldCheck } from'lucide-react';
import { useForm } from'react-hook-form';
import toast from'react-hot-toast';
import { z } from'zod';

import { login as loginApi } from'@/api/authApi';
import { Button } from'@/components/ui/button';
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from'@/components/ui/card';
import { Input } from'@/components/ui/input';
import { Label } from'@/components/ui/label';
import { getDashboardPath } from '@/utils/navigation';
import { useAuthStore } from'@/store/authStore';

const loginSchema = z.object({
 email: z.string().email('Enter a valid email address'),
 password: z.string().min(6,'Password must be at least 6 characters'),
});

function Login() {
 const navigate = useNavigate();
 const { setAuth, isAuthenticated, user, isHydrated } = useAuthStore();

 const form = useForm({
 resolver: zodResolver(loginSchema),
 defaultValues: {
 email:'',
 password:'',
 },
 });

 useEffect(() => {
 if (isHydrated && isAuthenticated && user?.role) {
 navigate(getDashboardPath(user.role), { replace: true });
 }
 }, [isAuthenticated, isHydrated, navigate, user]);

 const mutation = useMutation({
 mutationFn: loginApi,
 onSuccess: ({ user: authUser, token }) => {
 setAuth({ user: authUser, token });
 navigate(getDashboardPath(authUser.role), { replace: true });
 },
 onError: (error) => {
 toast.error(
 error.response?.data?.message ||'Unable to sign in. Please try again.'
);
 },
 });

 const onSubmit = form.handleSubmit((values) => {
 mutation.mutate(values);
 });

 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
 <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
 <div className="flex flex-col justify-center rounded-[2rem] border border-slate-200/80 bg-white/92 p-8 text-gray-900 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10 lg:p-14">
 <div className="inline-flex w-fit items-center gap-3 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
 <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-white">
 P
 </span>
 Performix
 </div>

 <div className="mt-8 max-w-xl">
 <h1 className="m-0 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
 Align work with outcomes your teams can actually measure.
 </h1>
 <p className="mt-5 text-lg leading-8 text-gray-700">
 Align. Track. Achieve. A focused performance workspace for goals,
 approvals, check-ins, and leadership visibility.
 </p>
 </div>

 <div className="mt-10 grid gap-4 sm:grid-cols-2">
 <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
 <ShieldCheck className="size-8 text-emerald-600" />
 <div className="mt-4 text-lg font-bold text-gray-900">
 Structured approvals
 </div>
 <p className="mt-2 text-sm leading-6 text-gray-600">
 Keep reviews, returns, and shared accountability moving through a
 clear workflow.
 </p>
 </div>
 <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
 <LockKeyhole className="size-8 text-sky-700" />
 <div className="mt-4 text-lg font-bold text-gray-900">
 Secure role access
 </div>
 <p className="mt-2 text-sm leading-6 text-gray-600">
 Employees, managers, and admins each land in the experience built
 for their responsibilities.
 </p>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-center">
 <Card className="bg-white shadow-lg rounded-xl w-full max-w-md">
 <CardHeader>
 <CardTitle className="text-gray-900 text-2xl font-bold">Sign in to Performix</CardTitle>
 <CardDescription className="text-gray-500 text-sm">
 Enter your credentials to access your dashboard and stay on top
 of goals and progress.
 </CardDescription>
 </CardHeader>
 <CardContent>
 <form className="space-y-5" onSubmit={onSubmit}>
 <div className="space-y-2">
 <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
 <Input
 id="email"
 type="email"
 placeholder="you@company.com"
 autoComplete="email"
 className="text-gray-900 bg-white border border-gray-300"
 {...form.register('email')}
 />
 {form.formState.errors.email ? (
 <p className="text-sm text-rose-600">
 {form.formState.errors.email.message}
 </p>
) : null}
 </div>

 <div className="space-y-2">
 <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
 <Input
 id="password"
 type="password"
 placeholder="Enter your password"
 autoComplete="current-password"
 className="text-gray-900 bg-white border border-gray-300"
 {...form.register('password')}
 />
 {form.formState.errors.password ? (
 <p className="text-sm text-rose-600">
 {form.formState.errors.password.message}
 </p>
) : null}
 </div>

 <Button
 type="submit"
 size="lg"
 className="h-11 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800"
 disabled={mutation.isPending}
 >
 {mutation.isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Signing in...
 </>
) : (
'Sign in'
)}
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 </div>
);
}

export default Login;
