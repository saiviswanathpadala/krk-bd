import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/customer/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { PropertyDetailsPage } from './pages/customer/PropertyDetailsPage';
import { ScheduleVisitPage } from './pages/customer/ScheduleVisitPage';
import { ContactPage } from './pages/customer/ContactPage';
import { LoanAssistancePage } from './pages/customer/LoanAssistancePage';
import { AIChatPage } from './pages/customer/AIChatPage';
import { PendingVerificationPage } from './pages/PendingVerificationPage';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminCustomerDetailPage } from './pages/admin/AdminCustomerDetailPage';
import { AdminAgentsPage } from './pages/admin/AdminAgentsPage';
import { AdminAgentDetailPage } from './pages/admin/AdminAgentDetailPage';
import { AdminEmployeesPage } from './pages/admin/AdminEmployeesPage';
import { AdminEmployeeDetailPage } from './pages/admin/AdminEmployeeDetailPage';
import { AdminEmployeeFormPage } from './pages/admin/AdminEmployeeFormPage';
import { AdminPropertiesPage } from './pages/admin/AdminPropertiesPage';
import { AdminPropertiesListPage } from './pages/admin/AdminPropertiesListPage';
import { AdminBannersListPage } from './pages/admin/AdminBannersListPage';
import { AdminPropertyDetailPage } from './pages/admin/AdminPropertyDetailPage';
import { AdminPropertyEditPage } from './pages/admin/AdminPropertyEditPage';
import { AdminBannerDetailPage } from './pages/admin/AdminBannerDetailPage';
import { AdminBannerEditPage } from './pages/admin/AdminBannerEditPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminPendingChangesPage } from './pages/admin/AdminPendingChangesPage';
import { AdminPendingChangeDetailPage } from './pages/admin/AdminPendingChangeDetailPage';
import { AdminLoanRequestsPage } from './pages/admin/AdminLoanRequestsPage';
import { AdminLoanRequestDetailPage } from './pages/admin/AdminLoanRequestDetailPage';
import { AgentDetailsPage } from './pages/AgentDetailsPage';
import { CustomerDetailsPage } from './pages/CustomerDetailsPage';
import { EmployeeHomePage } from './pages/employee/EmployeeHomePage';
import { EmployeePropertiesPage } from './pages/employee/EmployeePropertiesPage';
import { EmployeePropertyDetailPage } from './pages/employee/EmployeePropertyDetailPage';
import { EmployeePropertyEditPage } from './pages/employee/EmployeePropertyEditPage';
import { EmployeeAgentsPage } from './pages/employee/EmployeeAgentsPage';
import { EmployeeAgentDetailPage } from './pages/employee/EmployeeAgentDetailPage';
import { EmployeeBannersPage } from './pages/employee/EmployeeBannersPage';
import { EmployeeBannerDetailPage } from './pages/employee/EmployeeBannerDetailPage';
import { EmployeeBannerEditPage } from './pages/employee/EmployeeBannerEditPage';
import { EmployeeLoanRequestsPage } from './pages/employee/EmployeeLoanRequestsPage';
import { EmployeeLoanRequestDetailPage } from './pages/employee/EmployeeLoanRequestDetailPage';
import { ChatPage } from './pages/ChatPage';
import { AppLayout } from './layouts/AppLayout';
import { useAuthStore } from './store/authStore';
import { NotFoundPage } from './pages/NotFoundPage';
import { ScrollToTop } from './components/ScrollToTop';

// Configure QueryClient with caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      structuralSharing: true, // Compare old vs new data, only update if different
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/" />;
  
  if (user?.deleted) {
    return <Navigate to="/" replace />;
  }
  
  if ((user?.role === 'agent' || user?.role === 'customer') && !user?.approved) {
    return <Navigate to="/pending-verification" replace />;
  }
  
  if (allowedRoles && user?.role) {
    const userRole = user.role.toLowerCase();
    const isAllowed = allowedRoles.some(role => userRole === role.toLowerCase());
    if (!isAllowed) return <NotFoundPage />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

const PendingVerificationRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/" />;
  
  if (user?.deleted) {
    return <Navigate to="/" replace />;
  }
  
  // Only allow unapproved agents/customers
  if ((user?.role === 'agent' || user?.role === 'customer') && !user?.approved) {
    return <>{children}</>;
  }
  
  // Redirect approved users to their home page
  if (user?.role === 'admin') return <Navigate to="/admin/home" replace />;
  if (user?.role === 'employee') return <Navigate to="/employee/home" replace />;
  if (user?.role === 'agent' || user?.role === 'customer') return <Navigate to="/home" replace />;
  
  return <Navigate to="/" replace />;
};

function App() {
  const { token, user, updateUser, clearAuth } = useAuthStore();
  const [hasChecked, setHasChecked] = React.useState(false);

  useEffect(() => {
    if (hasChecked) return;
    
    const refreshUserData = async () => {
      if (token) {
        try {
          const { userAPI } = await import('./utils/api');
          const response = await userAPI.getProfile(token);
          
          // If user is deleted, clear everything and redirect
          if (response.data.user.deleted) {
            clearAuth();
            queryClient.clear();
            localStorage.clear();
            sessionStorage.clear();
            return;
          }
          
          updateUser(response.data.user);
        } catch (error) {
          clearAuth();
        }
      }
      setHasChecked(true);
    };
    
    refreshUserData();
  }, [token, hasChecked, clearAuth, updateUser]);

  // Check if user is deleted on every render
  useEffect(() => {
    if (user?.deleted) {
      clearAuth();
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
    }
  }, [user?.deleted, clearAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<ProtectedRoute allowedRoles={['customer', 'agent']}><HomePage /></ProtectedRoute>} />
          <Route path="/property/:id" element={<ProtectedRoute allowedRoles={['customer', 'agent']}><PropertyDetailsPage /></ProtectedRoute>} />
          <Route path="/property/:id/schedule-visit" element={<ProtectedRoute allowedRoles={['customer', 'agent']}><ScheduleVisitPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer', 'agent']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin/home" element={<ProtectedRoute allowedRoles={['admin']}><AdminHomePage /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']}><AdminCustomersPage /></ProtectedRoute>} />
          <Route path="/admin/customers/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminCustomerDetailPage /></ProtectedRoute>} />
          <Route path="/admin/agents" element={<ProtectedRoute allowedRoles={['admin']}><AdminAgentsPage /></ProtectedRoute>} />
          <Route path="/admin/agents/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminAgentDetailPage /></ProtectedRoute>} />
          <Route path="/admin/employees" element={<ProtectedRoute allowedRoles={['admin']}><AdminEmployeesPage /></ProtectedRoute>} />
          <Route path="/admin/employees/new" element={<ProtectedRoute allowedRoles={['admin']}><AdminEmployeeFormPage /></ProtectedRoute>} />
          <Route path="/admin/employees/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminEmployeeDetailPage /></ProtectedRoute>} />
          <Route path="/admin/employees/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminEmployeeFormPage /></ProtectedRoute>} />
          <Route path="/admin/properties" element={<ProtectedRoute allowedRoles={['admin']}><AdminPropertiesPage /></ProtectedRoute>} />
          <Route path="/admin/properties/list" element={<ProtectedRoute allowedRoles={['admin']}><AdminPropertiesListPage /></ProtectedRoute>} />
          <Route path="/admin/properties/new/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminPropertyEditPage /></ProtectedRoute>} />
          <Route path="/admin/properties/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminPropertyDetailPage /></ProtectedRoute>} />
          <Route path="/admin/properties/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminPropertyEditPage /></ProtectedRoute>} />
          <Route path="/admin/banners" element={<ProtectedRoute allowedRoles={['admin']}><AdminBannersPage /></ProtectedRoute>} />
          <Route path="/admin/banners/list" element={<ProtectedRoute allowedRoles={['admin']}><AdminBannersListPage /></ProtectedRoute>} />
          <Route path="/admin/banners/new/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminBannerEditPage /></ProtectedRoute>} />
          <Route path="/admin/banners/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminBannerDetailPage /></ProtectedRoute>} />
          <Route path="/admin/banners/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminBannerEditPage /></ProtectedRoute>} />
          <Route path="/admin/pending-changes" element={<ProtectedRoute allowedRoles={['admin']}><AdminPendingChangesPage /></ProtectedRoute>} />
          <Route path="/admin/pending-changes/:changeId" element={<ProtectedRoute allowedRoles={['admin']}><AdminPendingChangeDetailPage /></ProtectedRoute>} />
          <Route path="/admin/loan-requests" element={<ProtectedRoute allowedRoles={['admin']}><AdminLoanRequestsPage /></ProtectedRoute>} />
          <Route path="/admin/loan-requests/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminLoanRequestDetailPage /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/customer/:id" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><CustomerDetailsPage /></ProtectedRoute>} />
          <Route path="/employee/home" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeHomePage /></ProtectedRoute>} />
          <Route path="/employee/properties" element={<ProtectedRoute allowedRoles={['employee']}><EmployeePropertiesPage /></ProtectedRoute>} />
          <Route path="/employee/properties/new" element={<ProtectedRoute allowedRoles={['employee']}><EmployeePropertyDetailPage /></ProtectedRoute>} />
          <Route path="/employee/properties/:id" element={<ProtectedRoute allowedRoles={['employee']}><EmployeePropertyDetailPage /></ProtectedRoute>} />
          <Route path="/employee/properties/:id/edit" element={<ProtectedRoute allowedRoles={['employee']}><EmployeePropertyEditPage /></ProtectedRoute>} />
          <Route path="/employee/agents" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeAgentsPage /></ProtectedRoute>} />
          <Route path="/employee/agents/:id" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeAgentDetailPage /></ProtectedRoute>} />
          <Route path="/employee/banners" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeBannersPage /></ProtectedRoute>} />
          <Route path="/employee/banners/new/edit" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeBannerEditPage /></ProtectedRoute>} />
          <Route path="/employee/banners/:id" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeBannerDetailPage /></ProtectedRoute>} />
          <Route path="/employee/banners/:id/edit" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeBannerEditPage /></ProtectedRoute>} />
          <Route path="/employee/loan-requests" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeLoanRequestsPage /></ProtectedRoute>} />
          <Route path="/employee/loan-requests/:id" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeLoanRequestDetailPage /></ProtectedRoute>} />
          <Route path="/employee/profile" element={<ProtectedRoute allowedRoles={['employee']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute allowedRoles={['agent', 'admin', 'employee']}><ChatPage /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute allowedRoles={['customer', 'agent']}><ContactPage /></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute allowedRoles={['customer']}><AIChatPage /></ProtectedRoute>} />
          <Route path="/loan-assistance" element={<ProtectedRoute allowedRoles={['customer', 'agent']}><LoanAssistancePage /></ProtectedRoute>} />
          <Route path="/pending-verification" element={<PendingVerificationRoute><PendingVerificationPage /></PendingVerificationRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
