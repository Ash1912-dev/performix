import api from './axios';

export const suggestGoal = async (data) => {
  const response = await api.post('/ai/suggest-goal', data);
  return response.data;
};
