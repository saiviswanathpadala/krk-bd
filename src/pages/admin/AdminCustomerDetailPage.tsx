import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Trash2,
  User,
  AlertCircle,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profileImgUrl?: string;
  dateOfBirth?: string;
  preferredCategories?: string[];
  profileCompleted: boolean;
  role: string;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  referredByAgent?: {
    id: number;
    name: string;
    email: string;
  };
}

const DetailSkeleton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const returnTo = (location.state as any)?.returnTo || '/admin/customers';
  
  return (
    <div className="min-h-screen pb-8">
      {/* Static Header - No Loading */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
            navigate(returnTo);
          }}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Customer Details</h1>
        <div className="w-9 sm:w-10" />
      </div>
    
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4" />
          <Skeleton className="h-6 sm:h-7 w-40 sm:w-48 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        
        <div className="border-t border-border pt-6 mb-6">
          <Skeleton className="h-5 sm:h-6 w-40 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-full max-w-xs" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-border pt-6 mb-6">
          <Skeleton className="h-5 sm:h-6 w-40 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-full max-w-xs" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-border pt-6">
          <Skeleton className="h-12 sm:h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
  );
};

const InfoRow: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 mb-4 last:mb-0">
    <div className="w-6 flex items-center justify-center pt-0.5 flex-shrink-0">
      <div className="text-primary">
        {icon}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-base font-medium text-foreground break-words">{value || 'Not provided'}</p>
    </div>
  </div>
);

export const AdminCustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const customerId = id || null;
  const returnTo = (location.state as any)?.returnTo || '/admin/customers';
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: customer,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<Customer>({
    queryKey: ['admin-customer', customerId],
    queryFn: async () => {
      const response = await adminAPI.getCustomerById(token!, customerId!);
      return response.data;
    },
    enabled: !!token && !!customerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deleteCustomer(token!, Number(customerId!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Customer deleted successfully');
      navigate(returnTo);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never logged in';
    return formatDate(dateString);
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || (!customer && !isLoading)) {
    const isConnectionError = (error as any)?.code === 'ECONNREFUSED' || 
                              (error as any)?.message?.includes('Network Error') ||
                              (error as any)?.response === undefined;
    
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate('/admin/customers')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Customer Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">
            {isConnectionError ? 'Backend Server Not Running' : 'Customer Not Found'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">
            {isConnectionError 
              ? 'Please make sure the backend server is running on port 3000.'
              : "The customer you're looking for doesn't exist or has been deleted."}
          </p>
          <button
            onClick={() => isConnectionError ? refetch() : navigate(returnTo)}
            disabled={isRefetching}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isConnectionError ? (
              <>
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="text-sm sm:text-base font-semibold">{isRefetching ? 'Retrying...' : 'Try Again'}</span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-semibold">Go Back</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
            navigate(returnTo);
          }}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Customer Details</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4">
              {customer.profileImgUrl ? (
                <img
                  src={customer.profileImgUrl}
                  alt={customer.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center ${customer.profileImgUrl ? 'hidden' : ''}`}>
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 text-center">
              {customer.name || 'No Name Provided'}
            </h2>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span
                className={`px-4 py-2 text-xs font-semibold rounded-full text-white ${
                  customer.profileCompleted ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
              >
                {customer.profileCompleted ? 'Profile Complete' : 'Profile Incomplete'}
              </span>
              <span className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-full capitalize">
                {customer.role}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Contact Information</h3>
            <InfoRow
              icon={<Mail className="w-5 h-5" />}
              label="Email Address"
              value={customer.email}
            />
            <InfoRow
              icon={<Phone className="w-5 h-5" />}
              label="Phone Number"
              value={customer.phone}
            />
            <InfoRow
              icon={<MapPin className="w-5 h-5" />}
              label="City"
              value={customer.city}
            />
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Account Information</h3>
            <InfoRow
              icon={<Calendar className="w-5 h-5" />}
              label="Joined Date"
              value={formatDate(customer.createdAt)}
            />
            <InfoRow
              icon={<Clock className="w-5 h-5" />}
              label="Last Login"
              value={formatLastLogin(customer.lastLogin)}
            />
            <InfoRow
              icon={<RefreshCw className="w-5 h-5" />}
              label="Last Updated"
              value={formatDate(customer.updatedAt)}
            />
            <InfoRow
              icon={<Shield className="w-5 h-5" />}
              label="Account Status"
              value={customer.approved ? 'Approved' : 'Pending Approval'}
            />
          </div>

          <div className="border-t border-border pt-6">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
              Delete Customer
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer?.name || 'this customer'}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
