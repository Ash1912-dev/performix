import api from './axios';

export const getTeamGoals = async () => {
  const response = await api.get('/goals/team');
  return response.data.data;
};

export const approveGoalSheet = async (sheetId) => {
  const response = await api.put(`/goals/approve/${sheetId}`);
  return response.data;
};

export const returnGoalSheet = async (sheetId, reason) => {
  const response = await api.put(`/goals/return/${sheetId}`, { reason });
  return response.data;
};

export const managerEditGoal = async (goalId, data) => {
  const response = await api.put(`/goals/manager-edit/${goalId}`, data);
  return response.data;
};

export const getTeamCheckIns = async () => {
  const response = await api.get('/checkins/team');
  return response.data.data;
};

export const addManagerComment = async (checkinId, comment) => {
  const response = await api.put(`/checkins/${checkinId}/comment`, {
    managerComment: comment,
  });
  return response.data;
};

export const getCheckInSummary = async (employeeId) => {
  const response = await api.get(`/checkins/summary/${employeeId}`);
  return response.data.data;
};
