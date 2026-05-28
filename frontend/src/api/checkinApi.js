import api from './axios';

export const submitCheckIn = async (data) => {
  const res = await api.post('/checkins', data);
  return res.data.data;
};

export const getMyCheckIns = async () => {
  const res = await api.get('/checkins/my');
  return res.data.data;
};

export const getTeamCheckIns = async () => {
  const res = await api.get('/checkins/team');
  return res.data.data;
};

export const addManagerComment = async (checkinId, comment) => {
  const res = await api.put(`/checkins/${checkinId}/comment`, { comment });
  return res.data.data;
};

export const getCheckInSummary = async (employeeId) => {
  const res = await api.get(`/checkins/summary/${employeeId}`);
  return res.data.data;
};
