import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Bearer Token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('railalert_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we are already testing login
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('railalert_token');
        localStorage.removeItem('railalert_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login/json', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const trainsAPI = {
  list: async (search = '') => {
    const res = await apiClient.get('/trains/', { params: search ? { search } : {} });
    return res.data;
  },
};

export const complaintsAPI = {
  create: async (complaintData) => {
    const res = await apiClient.post('/complaints/', complaintData);
    return res.data;
  },
  getPassengerComplaints: async () => {
    const res = await apiClient.get('/complaints/');
    return res.data;
  },
  getAllComplaints: async (filters = {}) => {
    const res = await apiClient.get('/complaints/all', { params: filters });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/complaints/${id}`);
    return res.data;
  },
  updateStatus: async (id, payload) => {
    const res = await apiClient.put(`/complaints/${id}/status`, payload);
    return res.data;
  },
};

export const lostItemsAPI = {
  create: async (itemData) => {
    const res = await apiClient.post('/lost-items/', itemData);
    return res.data;
  },
  getPassengerItems: async () => {
    const res = await apiClient.get('/lost-items/');
    return res.data;
  },
  getAllItems: async (filters = {}) => {
    const res = await apiClient.get('/lost-items/all', { params: filters });
    return res.data;
  },
  updateStatus: async (id, payload) => {
    const res = await apiClient.put(`/lost-items/${id}/status`, payload);
    return res.data;
  },
};

export const documentsAPI = {
  getPresignedUrl: async (filename, fileType, folder = 'complaints') => {
    const res = await apiClient.post('/documents/upload-url', {
      filename,
      file_type: fileType,
      folder,
    });
    return res.data;
  },
  uploadToS3: async (uploadUrl, file, fileType) => {
    // Direct upload via fetch or axios without default headers
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileType,
        },
        body: file,
      });
      return response.ok;
    } catch (e) {
      console.warn('Presigned direct upload fallback:', e);
      return false;
    }
  },
};

export const adminAPI = {
  getAnalytics: async () => {
    const res = await apiClient.get('/admin/analytics');
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await apiClient.get('/admin/audit-logs');
    return res.data;
  },
};

export default apiClient;
