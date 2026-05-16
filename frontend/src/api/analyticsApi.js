import api from './axios';

export const getOrgOverview = async (cycleYear) => {
  const response = await api.get('/analytics/org-overview', {
    params: { cycleYear },
  });
  return response.data.data;
};

export const getEmployeeTrends = async (params) => {
  const response = await api.get('/analytics/employee-trends', { params });
  return response.data.data;
};

export const getTeamTrends = async (params) => {
  const response = await api.get('/analytics/team-trends', { params });
  return response.data.data;
};

export const getDepartmentTrends = async (params) => {
  const response = await api.get('/analytics/department-trends', { params });
  return response.data.data;
};

export const getGoalDistribution = async (params) => {
  const response = await api.get('/analytics/goal-distribution', { params });
  return response.data.data;
};

export const getCompletionHeatmap = async (cycleYear) => {
  const response = await api.get('/analytics/completion-heatmap', {
    params: { cycleYear },
  });
  return response.data.data;
};

export const getManagerEffectivenessDashboard = async () => {
  const response = await api.get('/analytics/manager-effectiveness');
  return response.data.data;
};
