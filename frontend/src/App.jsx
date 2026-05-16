import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/layouts/AdminLayout';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import ManagerLayout from '@/components/layouts/ManagerLayout';
import CheckIns from '@/pages/employee/CheckIns';
import Dashboard from '@/pages/employee/Dashboard';
import Goals from '@/pages/employee/Goals';
import Login from '@/pages/Login';
import ManagerCheckIns from '@/pages/manager/CheckIns';
import ManagerDashboard from '@/pages/manager/Dashboard';
import SharedGoals from '@/pages/manager/SharedGoals';
import TeamGoals from '@/pages/manager/TeamGoals';
import AdminAnalytics from '@/pages/admin/Analytics';
import AdminAuditLog from '@/pages/admin/AuditLog';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminEscalation from '@/pages/admin/Escalation';
import AdminGoals from '@/pages/admin/Goals';
import AdminReports from '@/pages/admin/Reports';
import AdminUsers from '@/pages/admin/Users';
import NotFound from '@/pages/NotFound';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient();

function AuthBootstrap() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="goals" element={<Goals />} />
              <Route path="checkins" element={<CheckIns />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
            <Route path="/manager" element={<ManagerLayout />}>
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="team-goals" element={<TeamGoals />} />
              <Route path="checkins" element={<ManagerCheckIns />} />
              <Route path="shared-goals" element={<SharedGoals />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="goals" element={<AdminGoals />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="escalation" element={<AdminEscalation />} />
              <Route path="audit" element={<AdminAuditLog />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
