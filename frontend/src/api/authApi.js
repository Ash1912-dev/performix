import api from './axios';

const normalizeUser = (user) => ({
  _id: user?._id || user?.id || '',
  name: user?.name || '',
  email: user?.email || '',
  role: user?.role || '',
  department: user?.department || '',
  managerId: user?.managerId || null,
});

export const login = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  const meResponse = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    token,
    user: normalizeUser(meResponse.data.user || user),
  };
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return normalizeUser(response.data.user);
};
