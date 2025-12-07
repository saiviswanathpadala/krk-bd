import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Mail, Phone, MapPin, Calendar, User, AlertCircle, RefreshCw } from 'lucide-react';
import { employeeAPI } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeCustomerDetailModalProps {
  visible: boolean;
  customerId: number | null;
  onClose: () => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs sm:text-sm text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm sm:text-base text-foreground font-medium break-words">{value}</p>
    </div>
  </div>
);

export const EmployeeCustomerDetailModal: React.FC<EmployeeCustomerDetailModalProps> = ({
  visible,
  customerId,
  onClose,
}) => {
  const { token } = useAuthStore();

  const { data: customerResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['employee-customer', customerId],
    queryFn: async () => {
      const response = await employeeAPI.getCustomerById(token!, customerId!);
      return response.data;
    },
    enabled: visible && !!token && !!customerId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const customer = customerResponse?.data || customerResponse;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg sm:rounded-xl rounded-t-3xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Customer Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0" aria-label="Close">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4" />
                <Skeleton className="h-6 sm:h-7 w-40 sm:w-48" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error || !customer ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
              <p className="text-sm sm:text-base text-foreground font-semibold mb-2 text-center">Failed to Load Customer</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 text-center max-w-sm">Unable to fetch customer details. Please try again.</p>
              <button onClick={() => refetch()} className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base font-semibold">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                {customer.profileImgUrl ? (
                  <img
                    src={customer.profileImgUrl}
                    alt={customer.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mb-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 ${customer.profileImgUrl ? 'hidden' : ''}`}>
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground text-center">
                  {customer.name || 'No Name'}
                </h3>
              </div>

              <div className="space-y-1">
                <InfoRow
                  icon={<Mail className="w-5 h-5" />}
                  label="Email"
                  value={customer.email || 'Not provided'}
                />
                <InfoRow
                  icon={<Phone className="w-5 h-5" />}
                  label="Phone"
                  value={customer.phone || 'Not provided'}
                />
                {customer.city && (
                  <InfoRow
                    icon={<MapPin className="w-5 h-5" />}
                    label="City"
                    value={customer.city}
                  />
                )}
                {customer.createdAt && (
                  <InfoRow
                    icon={<Calendar className="w-5 h-5" />}
                    label="Joined"
                    value={formatDate(customer.createdAt)}
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-border p-4 sm:p-6">
          <button onClick={onClose} className="w-full px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
