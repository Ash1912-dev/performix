import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, Sparkles, Shield, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { login as loginApi } from '@/api/authApi';
import { getDashboardPath } from '@/utils/navigation';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const demoUsers = [
  {
    role: 'Employee',
    email: 'amit@performix.com',
    password: 'Password@123',
    color: 'blue',
    description: 'Approved goals + Q2 check-ins',
  },
  {
    role: 'Manager',
    email: 'rahul@performix.com',
    password: 'Password@123',
    color: 'indigo',
    description: 'Team approvals + shared goals',
  },
  {
    role: 'Admin',
    email: 'admin@performix.com',
    password: 'Password@123',
    color: 'violet',
    description: 'Full system access + analytics',
  },
];

const colorMap = {
  blue: {
    border: 'border-blue-200 hover:border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    ring: 'ring-blue-500/20',
  },
  indigo: {
    border: 'border-indigo-200 hover:border-indigo-400',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700',
    ring: 'ring-indigo-500/20',
  },
  violet: {
    border: 'border-violet-200 hover:border-violet-400',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    ring: 'ring-violet-500/20',
  },
};

function Login() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated, user, isHydrated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
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
        error.response?.data?.message || 'Unable to sign in. Please try again.'
      );
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  const fillDemo = (demoUser) => {
    form.setValue('email', demoUser.email, { shouldValidate: true });
    form.setValue('password', demoUser.password, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — dark branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 flex-col justify-between p-10 relative overflow-hidden">
        {/* subtle gradient orbs */}
        <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-20 right-0 w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              P
            </span>
            <span className="text-xl font-bold text-white">Performix</span>
          </div>
        </div>

        <div className="relative z-10 max-w-sm">
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Welcome back
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            Sign in to your performance portal
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Sparkles, label: 'AI-powered goal suggestions' },
              { icon: TrendingUp, label: 'Real-time progress tracking' },
              { icon: Shield, label: 'Enterprise-grade security' },
            ].map((feat) => (
              <div
                key={feat.label}
                className="flex items-center gap-3 text-slate-300"
              >
                <feat.icon className="size-4 text-blue-400" />
                <span className="text-sm">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* RIGHT — login form */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
              P
            </span>
            <span className="text-lg font-bold text-slate-900">Performix</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Sign in to Performix
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your credentials to access your dashboard
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password ? (
                <p className="text-sm text-rose-600">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-semibold transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-500 font-medium">
                or continue with
              </span>
            </div>
          </div>

          {/* demo credentials */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Demo Credentials
            </h3>
            <div className="grid gap-2.5">
              {demoUsers.map((demoUser) => {
                const colors = colorMap[demoUser.color];
                return (
                  <button
                    key={demoUser.role}
                    type="button"
                    onClick={() => fillDemo(demoUser)}
                    className={`flex items-center justify-between rounded-xl border ${colors.border} p-3 text-left transition-all duration-200 hover:shadow-sm cursor-pointer group`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}
                        >
                          {demoUser.role}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {demoUser.description}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-blue-600 transition shrink-0 ml-3">
                      Login as {demoUser.role} →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
