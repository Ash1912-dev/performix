import api from './axios';

export const getAllUsers = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data.data;
};

export const createUser = async (data) => {
  const response = await api.post('/admin/users', data);
  return response.data.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data.data;
};

export const unlockGoal = async (goalId) => {
  const response = await api.put(`/admin/goals/${goalId}/unlock`);
  return response.data.data;
};

export const getAllGoals = async (params) => {
  const response = await api.get('/admin/goals', { params });
  return response.data;
};

export const getCycleStatus = async () => {
  const response = await api.get('/admin/cycle-status');
  return response.data.data;
};

export const getCompletionDashboard = async () => {
  const response = await api.get('/admin/completion-dashboard');
  return response.data.data;
};

export const exportAchievementReport = async (params) => {
  const response = await api.get('/reports/achievement/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const getCycleConfig = async (params) => {
  const response = await api.get('/admin/cycle-config', { params });
  return response.data.data;
};

export const updateCycleConfig = async (data) => {
  const response = await api.put('/admin/cycle-config', data);
  return response.data.data;
};
