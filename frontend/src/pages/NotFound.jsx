import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/navigation';

function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
 <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
 <div className="text-center">
 <h1 className="m-0 bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text text-[10rem] font-bold leading-none tracking-tighter text-transparent">
 404
 </h1>
 <h2 className="mt-2 text-2xl font-bold text-gray-900">Page Not Found</h2>
 <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-500">
 The page you&apos;re looking for doesn&apos;t exist or has been moved.
 Head back to your dashboard to continue.
 </p>
      <Button
        type="button"
        className="mt-8 rounded-xl bg-blue-600 px-6 text-white hover:bg-blue-700"
        onClick={() => navigate(getDashboardPath(user?.role))}
      >
 <ArrowLeft className="size-4" />
 Go to Dashboard
 </Button>
 </div>
 </div>
);
}

export default NotFound;
