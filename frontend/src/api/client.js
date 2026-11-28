import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ats_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired authentication session
      localStorage.removeItem('ats_token');
      localStorage.removeItem('ats_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login?session_expired=true';
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ==========================================
// 1. Auth API Client
// ==========================================
export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me')
};

// ==========================================
// 2. Admin API Client
// ==========================================
export const adminApi = {
  getUsers: (params = {}) => apiClient.get('/admin/users', { params }),
  createUser: (userData) => apiClient.post('/admin/users', userData),
  updateUserRole: (userId, role) => apiClient.patch(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId, isActive) => apiClient.patch(`/admin/users/${userId}/status`, { isActive }),
  getAuditLogs: (params = {}) => apiClient.get('/admin/audit-logs', { params })
};

// ==========================================
// 3. Jobs Management API Client
// ==========================================
export const jobsApi = {
  listJobs: (params = {}) => apiClient.get('/jobs', { params }),
  getJobById: (jobId) => apiClient.get(`/jobs/${jobId}`),
  createJob: (jobData) => apiClient.post('/jobs', jobData),
  updateJob: (jobId, jobData) => apiClient.put(`/jobs/${jobId}`, jobData),
  updateJobStatus: (jobId, status) => apiClient.patch(`/jobs/${jobId}/status`, { status })
};

// ==========================================
// 4. Candidate & Resumes API Client
// ==========================================

export const candidateApi = {
  getProfile: (candidateId) =>
    apiClient.get('/candidates/profile', {
      params: candidateId ? { candidateId } : {}
    }),

  updateProfile: (profileData) =>
    apiClient.put('/candidates/profile', profileData),

  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);

    return apiClient.post('/candidates/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Existing function: Download resume
  downloadResume: async (resumeId, filename = 'resume.pdf') => {
    const token = localStorage.getItem('ats_token');

    const response = await fetch(
      `${API_BASE_URL}/candidates/resume/${resumeId}/download`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download resume file.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    window.URL.revokeObjectURL(url);
  },

  // New function: Preview resume
  previewResume: async (resumeId) => {
    const token = localStorage.getItem('ats_token');

    const response = await fetch(
      `${API_BASE_URL}/candidates/resume/${resumeId}/preview`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to preview resume file.');
    }

    const blob = await response.blob();

    return window.URL.createObjectURL(blob);
  }
};

// ==========================================
// 5. Applications & Pipeline API Client
// ==========================================
export const applicationsApi = {
  apply: (payload) => apiClient.post('/applications', payload),
  getMyApplications: () => apiClient.get('/applications/my'),
  listApplications: (params = {}) => apiClient.get('/applications', { params }),
  getApplicationById: (applicationId) => apiClient.get(`/applications/${applicationId}`),
  transitionStage: (applicationId, { toStage, notes }) =>
    apiClient.patch(`/applications/${applicationId}/stage`, { toStage, notes })
};

// ==========================================
// 6. Interviews Scheduling API Client
// ==========================================
export const interviewsApi = {
  scheduleInterview: (interviewData) => apiClient.post('/interviews', interviewData),
  listInterviews: (params = {}) => apiClient.get('/interviews', { params }),
  updateInterview: (interviewId, updateData) => apiClient.patch(`/interviews/${interviewId}`, updateData)
};

// ==========================================
// 7. Offers & Onboarding API Client
// ==========================================
export const offersApi = {
  generateOffer: (offerData) => apiClient.post('/offers', offerData),
  respondToOffer: (offerId, decision) => apiClient.patch(`/offers/${offerId}/respond`, { decision }),
  getOnboarding: (offerId) => apiClient.get(`/offers/${offerId}/onboarding`),
  updateOnboardingTask: (taskId, isCompleted) => apiClient.patch(`/offers/onboarding/${taskId}`, { isCompleted })
};

// ==========================================
// 8. Hiring Analytics API Client
// ==========================================
export const analyticsApi = {
  getSummary: (params = {}) => apiClient.get('/analytics/summary', { params })
};

export default {
  authApi,
  adminApi,
  jobsApi,
  candidateApi,
  applicationsApi,
  interviewsApi,
  offersApi,
  analyticsApi
};

