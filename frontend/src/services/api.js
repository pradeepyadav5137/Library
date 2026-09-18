import axios from 'axios';

// The base URL of the backend API. 
// Uses VITE_API_URL or local dev default.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        if (window.location.pathname !== '/' && window.location.pathname !== '/admin-login') {
          window.location.href = '/';
        }
      }
    } else if (error.request) {
      console.error('Network Error: No response from server');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    }
  },

  sendOTP: async (data) => {
    try {
      const payload = {
        email: data.email || null,
        rollNo: data.rollNo || null,
        userType: data.userType || 'student'
      };
      const response = await api.post('/auth/send-otp', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send OTP' };
    }
  },

  verifyEmail: async (email, otp, userType) => {
    try {
      const payload = {
        email: email,
        otp: otp,
        userType: userType || 'student'
      };

      const response = await api.post('/auth/verify-email', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'OTP verification failed' };
    }
  }
};

export const applicationAPI = {
  submit: async (formData, onUploadProgress) => {
    try {
      const response = await api.post('/applications/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onUploadProgress) {
            onUploadProgress(percentCompleted);
          }
        }
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Application submission failed' };
    }
  },
 
  getById: async (id) => {
    try {
      const response = await api.get(`/applications/status/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch application' };
    }
  }
};

export const adminAPI = {
  loginStep1: async (username, password) => {
    try {
      const response = await api.post('/auth/admin-login', { username, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Invalid credentials' };
    }
  },

  loginStep2: async (username, otp) => {
    try {
      const response = await api.post('/auth/admin-login-step2', { username, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Invalid credentials' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/admin-forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reset OTP' };
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    try {
      const response = await api.post('/auth/admin-reset-password', {
        email,
        otp,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },

  getApplications: async (filters = {}) => {
    try {
      const response = await api.get('/admin/applications', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch applications' };
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch stats' };
    }
  },

  updateStatus: async (id, status, reason = null) => {
    try {
      const response = await api.patch(`/admin/applications/${id}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update status' };
    }
  },

  softDelete: async (id) => {
    try {
      const response = await api.delete(`/admin/applications/${id}`, {
        data: { hardDelete: false }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete application' };
    }
  },

  hardDelete: async (id) => {
    try {
      const response = await api.delete(`/admin/applications/${id}`, {
        data: { hardDelete: true }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to permanently delete application' };
    }
  },

  createAdmin: async (username, email, password) => {
    try {
      const response = await api.post('/admin/admins', {
        username,
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create admin' };
    }
  },

  getAllAdmins: async () => {
    try {
      const response = await api.get('/admin/admins');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admins' };
    }
  },

  deleteAdmin: async (id) => {
    try {
      const response = await api.delete(`/admin/admins/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete admin' };
    }
  },

  updateAdminRole: async (id, role) => {
    try {
      const response = await api.patch(`/admin/admins/${id}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update admin role' };
    }
  }
};

export default api;
