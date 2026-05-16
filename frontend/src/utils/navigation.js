/**
 * Get the dashboard path based on the user's role.
 * @param {string} role - The role of the user ('admin', 'manager', 'employee').
 * @returns {string} - The path to the dashboard.
 */
export const getDashboardPath = (role) => {
  if (!role) return '/login';

  const paths = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    employee: '/employee/dashboard',
  };

  return paths[role] || '/login';
};
