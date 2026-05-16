import api from './axios';

export const pushSharedGoal = async (data) => {
  const payload = {
    ...data,
    cycleYear: data.cycleYear ?? new Date().getFullYear(),
  };

  const response = await api.post('/shared-goals/push', payload);
  return response.data;
};

export const getSharedGoals = async () => {
  const response = await api.get('/shared-goals');
  return response.data.sharedGoals;
};

export const updateSharedAchievement = async (goalId, data) => {
  const response = await api.put(`/shared-goals/${goalId}/achievement`, data);
  return response.data;
};
