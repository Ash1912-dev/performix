import api from './axios';

export const getRules = async () => {
  const response = await api.get('/escalation/rules');
  return response.data.data;
};

export const createRule = async (data) => {
  const response = await api.post('/escalation/rules', data);
  return response.data.data;
};

export const updateRule = async (id, data) => {
  const response = await api.put(`/escalation/rules/${id}`, data);
  return response.data.data;
};

export const deleteRule = async (id) => {
  const response = await api.delete(`/escalation/rules/${id}`);
  return response.data.data;
};

export const getEscalationLogs = async (params) => {
  const response = await api.get('/escalation/logs', { params });
  return response.data;
};

export const resolveEscalation = async (id) => {
  const response = await api.put(`/escalation/logs/${id}/resolve`);
  return response.data.data;
};

export const runEscalationManually = async () => {
  const response = await api.post('/escalation/run');
  return response.data;
};
