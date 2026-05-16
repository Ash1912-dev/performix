import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/navigation';

function ProtectedRoute({ allowedRoles = [] }) {
 const { isAuthenticated, user, isHydrated } = useAuthStore();

 if (!isHydrated) {
 return null;
 }

 if (!isAuthenticated || !user) {
 return <Navigate to="/login" replace />;
 }

 if (!allowedRoles.includes(user.role)) {
 return <Navigate to={getDashboardPath(user.role)} replace />;
 }

 return <Outlet />;
}

export default ProtectedRoute;
