// NeuroScan - Centralized API Service Layer
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';

// Create axios instance
const api = axios.create({ baseURL: API_URL, timeout: 30000 });

// ─── Request interceptor: inject JWT ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('neuroscan_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('neuroscan_token');
      localStorage.removeItem('neuroscan_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth Service ─────────────────────────────────────────────
export const authApi = {
  register: (data)          => api.post('/auth/register', data),
  login:    (email, password) => api.post('/auth/login', { email, password }),
  me:       ()              => api.get('/auth/me'),
  createPatient: (data)     => api.post('/auth/create-patient', data),
};

// ─── Business Service ─────────────────────────────────────────
export const doctorApi = {
  list:          (params)  => api.get('/business/doctors', { params }),
  getById:       (id)      => api.get(`/business/doctors/${id}`),
  getMyProfile:  ()        => api.get('/business/doctors/me/profile'),
  getMyPatients: ()        => api.get('/business/doctors/me/patients'),
  updateProfile: (data)    => api.put('/business/doctors/me/profile', data),
};

export const patientApi = {
  getMyProfile:     ()     => api.get('/business/patients/me/profile'),
  getAssignedDoctor:()     => api.get('/business/patients/me/assigned-doctor'),
  updateProfile:    (data) => api.put('/business/patients/me/profile', data),
  getById:          (id)   => api.get(`/business/patients/${id}`),
};

export const linkApi = {
  sendRequest:      (targetId, message) => api.post('/business/links/request', { targetId, message }),
  accept:           (id)   => api.put(`/business/links/${id}/accept`),
  reject:           (id)   => api.put(`/business/links/${id}/reject`),
  getIncoming:      ()     => api.get('/business/links/incoming'),
  getOutgoing:      ()     => api.get('/business/links/outgoing'),
};

export const dashboardApi = {
  doctor:  () => api.get('/business/dashboard/doctor'),
  patient: () => api.get('/business/dashboard/patient'),
};

// ─── MRI Service ──────────────────────────────────────────────
export const mriApi = {
  upload: (formData, onProgress) => api.post('/mri/scans/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    }
  }),
  getPatientScans: (patientId) => api.get(`/mri/scans/patient/${patientId}`),
  getScanById:     (id)        => api.get(`/mri/scans/${id}`),
  updateStatus:    (id, status)=> api.put(`/mri/scans/${id}/status`, { status }),
};

export const diagnosisApi = {
  create:           (data)       => api.post('/mri/diagnoses', data),
  getByScan:        (scanId)     => api.get(`/mri/diagnoses/scan/${scanId}`),
  getByPatient:     (patientId)  => api.get(`/mri/diagnoses/patient/${patientId}`),
};

// ─── AI Service ──────────────────────────────────────────────
export const aiApi = {
  analyze: (data) => api.post('/ai/analyze', data),
  status:  ()     => api.get('/ai/status'),
};

// ─── Notification Service ─────────────────────────────────────
export const notificationApi = {
  getAll:      ()   => api.get('/notifications'),
  markRead:    (id) => api.put(`/notifications/${id}/read`),
  markAllRead: ()   => api.put('/notifications/read-all'),
};

// SSE stream (no axios, native EventSource)
export function createNotificationStream(onMessage) {
  const token = localStorage.getItem('neuroscan_token');
  const url   = `${API_URL}/notifications/stream`;
  const es    = new EventSource(`${url}?token=${token}`);
  es.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch (_) {}
  };
  es.onerror = () => { es.close(); };
  return es;
}

export default api;
