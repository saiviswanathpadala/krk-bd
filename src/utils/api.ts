import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Token will be added per-request via headers in each API call
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      console.error('Backend server is not running. Please start the backend server.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  validateToken: (token: string) => api.post('/auth/validate-token', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getMe: (token: string) => api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  logout: (token: string) => api.post('/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// User API
export const userAPI = {
  getProfile: (token: string) => api.get('/user/me', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (token: string, data: any) => api.put('/user/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getCategories: (token: string) => api.get('/user/categories', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getApprovedAgents: (token: string, q?: string) => api.get('/user/agents', {
    headers: { Authorization: `Bearer ${token}` },
    params: q ? { q } : {}
  }),
  getAdmins: (token: string) => api.get('/user/admins', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getReferredCustomers: (token: string) => api.get('/user/referred-customers', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getReferredCustomerById: (token: string, id: string) => api.get(`/user/referred-customers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteAccount: (token: string) => api.delete('/user/account', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Upload API
export const uploadAPI = {
  getSignedUrl: (token: string, fileName: string, contentType: string, purpose: string, fileSize: number) =>
    api.post('/uploads/signed-url', { fileName, contentType, purpose, size: fileSize }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  uploadToR2: async (uploadUrl: string, file: Blob, contentType: string) => {
    const response = await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': contentType },
    });
    return response;
  },
};

// Property API
export const propertyAPI = {
  getProperties: (token: string, cursor?: string, limit = 10) => api.get('/properties', {
    headers: { Authorization: `Bearer ${token}` },
    params: { cursor, limit }
  }),
  getPropertyById: (token: string, id: string) => api.get(`/properties/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Banner API
export const bannerAPI = {
  getBanners: (token: string) => api.get('/banners', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Admin API
export const adminAPI = {
  getProfile: (token: string) => api.get('/admin/profile', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (token: string, data: any) => api.put('/admin/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getDashboardStats: (token: string) => api.get('/admin/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getCustomerById: (token: string, id: string) => api.get(`/admin/customers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  logout: (token: string) => api.post('/admin/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Customers
  getCustomers: (token: string, params?: { limit?: number; cursor?: string; q?: string; city?: string }) => api.get('/admin/customers', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  
  deleteCustomer: (token: string, id: number) => api.delete(`/admin/customers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  bulkDeleteCustomers: (token: string, ids: number[]) => api.delete('/admin/customers', {
    headers: { Authorization: `Bearer ${token}` },
    data: { ids }
  }),
  // Agents
  getAgents: (token: string, params?: { status?: 'approved' | 'pending'; limit?: number; cursor?: string; q?: string; city?: string }) => api.get('/admin/agents', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getAgentById: (token: string, id: number) => api.get(`/admin/agents/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  approveAgent: (token: string, id: number, data?: { assign_to_employee_id?: number }) => api.post(`/admin/agents/${id}/approve`, data || {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  rejectAgent: (token: string, id: number, data: { reason: string; action?: 'delete' | 'retain' }) => api.post(`/admin/agents/${id}/reject`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteAgent: (token: string, id: number) => api.delete(`/admin/agents/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  bulkDeleteAgents: (token: string, ids: number[]) => api.delete('/admin/agents', {
    headers: { Authorization: `Bearer ${token}` },
    data: { ids }
  }),
  // Employees
  getEmployees: (token: string, params?: { limit?: number; cursor?: string; q?: string; department?: string }) => api.get('/admin/employees', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getEmployeeById: (token: string, id: number) => api.get(`/admin/employees/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createEmployee: (token: string, data: any) => api.post('/admin/employees', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateEmployee: (token: string, id: number, data: any) => api.patch(`/admin/employees/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteEmployee: (token: string, id: number) => api.delete(`/admin/employees/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  reassignAndDeleteEmployee: (token: string, id: number, data: { targetEmployeeId: number }) => api.post(`/admin/employees/${id}/reassign-and-delete`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getPropertiesLookup: (token: string, q?: string) => api.get('/admin/lookup/properties', {
    headers: { Authorization: `Bearer ${token}` },
    params: { q, limit: 100 }
  }),
  getAgentsLookup: (token: string, q?: string) => api.get('/admin/lookup/agents', {
    headers: { Authorization: `Bearer ${token}` },
    params: { q, limit: 100 }
  }),
  // Properties
  getProperties: (token: string, params?: { status?: 'approved' | 'pending' | 'needs_revision' | 'draft'; limit?: number; cursor?: string; q?: string }) => api.get('/admin/properties', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getPropertyById: (token: string, id: string) => api.get(`/admin/properties/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createProperty: (token: string, data: any) => api.post('/admin/properties', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProperty: (token: string, id: string, data: any) => api.put(`/admin/properties/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteProperty: (token: string, id: string) => api.delete(`/admin/properties/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Banners
  getBanners: (token: string, params?: { status?: 'approved' | 'pending' | 'needs_revision' | 'draft'; limit?: number; cursor?: string; q?: string }) => api.get('/admin/banners', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getBannerById: (token: string, id: number) => api.get(`/admin/banners/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createBanner: (token: string, data: any) => api.post('/admin/banners', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateBanner: (token: string, id: string | number, data: any) => api.put(`/admin/banners/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  deleteBanner: (token: string, id: string) => api.delete(`/admin/banners/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Loan Requests
  getLoanRequests: (token: string, params?: { status?: string; assignee?: number; priority?: string; slaState?: string; search?: string; startDate?: string; endDate?: string; limit?: number; cursor?: string; sort?: string }) => api.get('/admin/loan-requests', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getLoanRequestById: (token: string, id: string) => api.get(`/admin/loan-requests/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getLoanRequestStats: (token: string) => api.get('/admin/loan-requests/stats', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  reassignLoanRequest: (token: string, id: string, data: { assigneeId?: number; comment?: string; autoAssign?: boolean }) => api.post(`/admin/loan-requests/${id}/reassign`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  escalateLoanRequest: (token: string, id: string, data: { reason: string }) => api.post(`/admin/loan-requests/${id}/escalate`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  addLoanRequestComment: (token: string, id: string, data: { text: string; isPublic?: boolean }) => api.post(`/admin/loan-requests/${id}/comment`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  bulkReassignLoanRequests: (token: string, data: { ids: string[]; assigneeId?: number; autoAssign?: boolean }) => api.post('/admin/loan-requests/bulk-reassign', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  bulkEscalateLoanRequests: (token: string, data: { ids: string[]; reason: string }) => api.post('/admin/loan-requests/bulk-escalate', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getFinanceEmployees: (token: string, search?: string) => api.get('/admin/employees', {
    headers: { Authorization: `Bearer ${token}` },
    params: { department: 'Finance', q: search, limit: 50 }
  }),
  // Pending Changes
  getPendingChanges: (token: string, params?: { type?: 'property' | 'banner' | 'all'; status?: string; cursor?: string; limit?: number; q?: string; proposerId?: string }) => api.get('/admin/pending-changes', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getPendingChangeById: (token: string, changeId: string) => api.get(`/admin/pending-changes/${changeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  approvePendingChange: (token: string, changeId: string) => api.post(`/admin/pending-changes/${changeId}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  rejectPendingChange: (token: string, changeId: string, data: { reason: string }) => api.post(`/admin/pending-changes/${changeId}/reject`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  requestChanges: (token: string, changeId: string, data: { reason: string }) => {
    // Backend expects 'comments' but we keep 'reason' in the interface for consistency
    // Map reason to comments for the API call
    return api.post(`/admin/pending-changes/${changeId}/request-changes`, { comments: data.reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Draft Management
  createPropertyDraft: (token: string, propertyId: string | undefined, data: any) => api.post(`/admin/properties${propertyId ? `/${propertyId}` : ''}/draft`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateDraft: (token: string, draftId: string, data: any) => api.put(`/admin/drafts/${draftId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  submitDraft: (token: string, draftId: string) => api.post(`/admin/drafts/${draftId}/submit`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  discardDraft: (token: string, draftId: string) => api.delete(`/admin/drafts/${draftId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createBannerDraft: (token: string, bannerId: number | undefined, data: any) => api.post(`/admin/banners${bannerId ? `/${bannerId}` : ''}/draft`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateBannerDraft: (token: string, draftId: string, data: any) => api.put(`/admin/banner-drafts/${draftId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  submitBannerDraft: (token: string, draftId: string) => api.post(`/admin/banner-drafts/${draftId}/submit`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  discardBannerDraft: (token: string, draftId: string) => api.delete(`/admin/banner-drafts/${draftId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Employee API
export const employeeAPI = {
  getDashboardStats: (token: string) => api.get('/employee/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (token: string, data: any) => api.put('/employee/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  logout: (token: string) => api.post('/employee/logout', {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Properties
  getProperties: (token: string, params?: { cursor?: string; limit?: number; q?: string }) => api.get('/employee/properties', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getPropertyById: (token: string, id: string) => api.get(`/employee/properties/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createProperty: (token: string, data: any, isDraft?: boolean) => api.post('/employee/properties', isDraft !== undefined ? { ...data, isDraft } : data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  submitPendingChange: (token: string, id: string, data: any) => api.post(`/employee/properties/${id}/pending-change`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getPendingChanges: (token: string, params?: { cursor?: string; limit?: number }) => api.get('/employee/pending-changes', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  withdrawPendingChange: (token: string, changeId: string, moveToDraft?: boolean) => api.post(`/employee/pending-changes/${changeId}/withdraw`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    params: moveToDraft ? { moveToDraft: 'true' } : {}
  }),
  updateDraft: (token: string, changeId: string, data: any) => api.put(`/employee/drafts/${changeId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  submitDraft: (token: string, changeId: string) => api.post(`/employee/drafts/${changeId}/submit`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  discardDraft: (token: string, changeId: string) => api.delete(`/employee/drafts/${changeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Banners
  getBanners: (token: string, params?: { cursor?: string; limit?: number; q?: string; category?: string }) => api.get('/employee/banners', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getBannerById: (token: string, id: string) => api.get(`/employee/banners/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  createBanner: (token: string, data: any) => api.post('/employee/banners', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  submitBannerPendingChange: (token: string, id: string, data: any) => api.post(`/employee/banners/${id}/pending-change`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getBannerPendingChanges: (token: string, params?: { cursor?: string; limit?: number }) => api.get('/employee/banner-pending-changes', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  withdrawBannerPendingChange: (token: string, changeId: string, moveToDraft?: boolean) => api.post(`/employee/banner-pending-changes/${changeId}/withdraw`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    params: moveToDraft ? { moveToDraft: 'true' } : {}
  }),
  updateBannerDraft: (token: string, changeId: string, data: any) => api.put(`/employee/banner-drafts/${changeId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  submitBannerDraft: (token: string, changeId: string) => api.post(`/employee/banner-drafts/${changeId}/submit`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  discardBannerDraft: (token: string, changeId: string) => api.delete(`/employee/banner-drafts/${changeId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Agents
  getAgents: (token: string, params?: { cursor?: string; limit?: number; q?: string }) => api.get('/employee/agents', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getAgentById: (token: string, id: number) => api.get(`/employee/agents/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getAgentAssignedProperties: (token: string, id: number) => api.get(`/employee/agents/${id}/assigned-properties`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  assignPropertiesToAgent: (token: string, agentId: number, propertyIds: string[], note?: string) => api.post(`/employee/agents/${agentId}/assign-properties`, { propertyIds, note }, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Customers
  getCustomerById: (token: string, id: number) => api.get(`/employee/customers/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  // Loan Requests (for finance employees)
  getLoanRequests: (token: string, params?: { status?: string; search?: string; limit?: number; cursor?: string }) => api.get('/loan-requests/finance', {
    headers: { Authorization: `Bearer ${token}` },
    params
  }),
  getLoanRequestById: (token: string, id: string) => api.get(`/loan-requests/finance/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getLoanRequestStats: (token: string) => api.get('/loan-requests/finance/stats', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  takeLoanRequest: (token: string, id: string) => api.post(`/loan-requests/finance/${id}/take`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateLoanRequestStatus: (token: string, id: string, data: { status: string }) => api.post(`/loan-requests/finance/${id}/status`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  addLoanRequestComment: (token: string, id: string, data: { comment: string }) => api.post(`/loan-requests/finance/${id}/comment`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

// Contact API
export const contactAPI = {
  submitContact: (token: string, data: { subject: string; message: string }) => 
    api.post('/contact', data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getFAQs: (token: string) => api.get('/contact/faqs', {
    headers: { Authorization: `Bearer ${token}` }
  }),
};

export interface Agent {
  id: number;
  name: string;
  city: string;
  displayName: string;
}
