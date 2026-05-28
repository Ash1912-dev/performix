import api from './axios';

export const createGoal = async (data) => {
  const res = await api.post('/goals', data);
  return res.data.data;
};

export const getMyGoals = async () => {
  const res = await api.get('/goals/my');
  return res.data.data;
};

export const updateGoal = async (id, data) => {
  const res = await api.put(`/goals/${id}`, data);
  return res.data.data;
};

export const deleteGoal = async (id) => {
  const res = await api.delete(`/goals/${id}`);
  return res.data;
};

export const submitGoalSheet = async () => {
  const res = await api.post('/goals/submit');
  return res.data.data;
};

export const getTeamGoals = async () => {
  const res = await api.get('/goals/team');
  return res.data.data;
};

export const approveGoalSheet = async (sheetId) => {
  const res = await api.put(`/goals/approve/${sheetId}`);
  return res.data.data;
};

export const returnGoalSheet = async (sheetId, reason) => {
  const res = await api.put(`/goals/return/${sheetId}`, { reason });
  return res.data.data;
};

export const managerEditGoal = async (goalId, data) => {
  const res = await api.put(`/goals/manager-edit/${goalId}`, data);
  return res.data.data;
};
