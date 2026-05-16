import api from './axios';

export const createGoal = async (data) => {
  const response = await api.post('/goals', data);
  return response.data;
};

export const getMyGoals = async () => {
  const response = await api.get('/goals/my');
  return response.data.data;
};

export const updateGoal = async (id, data) => {
  const response = await api.put(`/goals/${id}`, data);
  return response.data;
};

export const deleteGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};

export const submitGoalSheet = async () => {
  const response = await api.post('/goals/submit');
  return response.data;
};
