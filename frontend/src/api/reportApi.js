import api from './axios';

export const getAchievementReport = async (params) => {
  const response = await api.get('/reports/achievement', { params });
  return response.data.data;
};

export const exportAchievementReport = async (params) => {
  const response = await api.get('/reports/achievement/export', {
    params,
    responseType: 'blob',
  });
  return response.data; // blob
};

export const getManagerEffectiveness = async () => {
  const response = await api.get('/reports/manager-effectiveness');
  return response.data.data;
};

export const getAuditLogs = async (params) => {
  const response = await api.get('/audit', { params });
  return response.data;
};

export const exportAuditLog = async (params) => {
  const response = await api.get('/audit/export', {
    params,
    responseType: 'blob',
  });
  return response.data; // blob
};
