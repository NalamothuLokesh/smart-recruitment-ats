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

// Helper to strip empty, null, or undefined parameters before network requests
const cleanParams = (params = {}) => {
  const cleaned = {};
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== '' && val !== undefined && val !== null) {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

// Response Interceptor: Global 401 handling and enriched error extraction
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
    let message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const fieldDetails = error.response.data.errors
        .map((e) => `${e.field || 'input'}: ${e.message}`)
        .join('; ');
      if (fieldDetails) {
        message = `${message} (${fieldDetails})`;
      }
    }
    const enhancedError = new Error(message);
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

// ==========================================
// 1. Auth API Client
// ==========================================
export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
  sendVerificationOtp: (email) => apiClient.post('/auth/send-verification-otp', { email }),
  verifyPin: (email, pin) => apiClient.post('/auth/verify-pin', { email, pin }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload)
};

// ==========================================
// 2. Admin API Client
// ==========================================
export const adminApi = {
  getUsers: (params = {}) => apiClient.get('/admin/users', { params: cleanParams(params) }),
  createUser: (userData) => apiClient.post('/admin/users', userData),
  updateUserRole: (userId, role) => apiClient.patch(`/admin/users/${userId}/role`, { role }),
  updateUserStatus: (userId, isActive) => apiClient.patch(`/admin/users/${userId}/status`, { isActive }),
  getAuditLogs: (params = {}) => apiClient.get('/admin/audit-logs', { params: cleanParams(params) })
};

// ==========================================
// 3. Jobs Management API Client
// ==========================================
export const jobsApi = {
  listJobs: (params = {}) => apiClient.get('/jobs', { params: cleanParams(params) }),
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
  getResumeFile: async (resumeId, filename = 'resume.pdf') => {
    const token = localStorage.getItem('ats_token');
    const response = await fetch(`${API_BASE_URL}/candidates/resume/${resumeId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to retrieve resume file.');
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  },
  downloadResume: async (resumeId, filename = 'resume.pdf') => {
    const file = await candidateApi.getResumeFile(resumeId, filename);
    const url = window.URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },
  previewResume: async (resumeId) => {
    const token = localStorage.getItem('ats_token');
    const response = await fetch(`${API_BASE_URL}/candidates/resume/${resumeId}/preview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to preview resume file.');
    }
    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  },
  deleteResume: (resumeId) => apiClient.delete(`/candidates/resume/${resumeId}`)
};

// ==========================================
// 5. Applications & Pipeline API Client
// ==========================================
export const applicationsApi = {
  apply: (payload) => apiClient.post('/applications', payload),
  getMyApplications: () => apiClient.get('/applications/my'),
  withdrawMyApplication: (applicationId, reason = '') => apiClient.patch(`/applications/${applicationId}/withdraw`, { reason }),
  dismissWithdrawnApplication: (applicationId) => apiClient.patch(`/applications/${applicationId}/dismiss`),
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

