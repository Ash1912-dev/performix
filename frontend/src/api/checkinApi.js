import api from './axios';

export const submitCheckIn = async (data) => {
  const response = await api.post('/checkins', data);
  return response.data;
};

export const getMyCheckIns = async () => {
  const response = await api.get('/checkins/my');
  return response.data.data;
};

export const getCheckInSummary = async (employeeId) => {
  const response = await api.get(`/checkins/summary/${employeeId}`);
  return response.data.data;
};
