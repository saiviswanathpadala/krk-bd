import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  Building2,
  ArrowLeft,
  RefreshCw,
  Home,
  UserPlus,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeAssignPropertiesModal } from '@/components/employee/EmployeeAssignPropertiesModal';
import { EmployeeCustomerDetailModal } from '@/components/employee/EmployeeCustomerDetailModal';

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profileImgUrl?: string;
  createdAt: string;
  assignedPropertiesCount: number;
  referredCustomers?: Array<{
    id: number;
    name: string;
    email: string;
    profileImgUrl?: string;
  }>;
}

interface LocationState {
  from?: string;
}

const InfoRow: React.FC<{ 
  icon: React.ReactNode; 
  value: string;
}> = ({ icon, value }) => (
  <div className="flex items-center gap-3">
    <div className="text-primary flex-shrink-0">
      {icon}
    </div>
    <p className="text-sm sm:text-base text-muted-foreground truncate">{value}</p>
  </div>
);

export const EmployeeAgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['employee-agents'] });
    };
  }, [queryClient]);
  
  const agentId = id ? parseInt(id) : null;

  const {
    data: agentResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employee-agent', agentId],
    queryFn: async () => {
      const response = await employeeAPI.getAgentById(token!, agentId!);
      return response.data;
    },
    enabled: !!token && !!agentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const agent = agentResponse?.data || agentResponse;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate('/employee/agents')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agent Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="px-4 sm:px-6 pt-4">
          {/* Profile Card Skeleton */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4" />
              <Skeleton className="h-6 sm:h-7 w-40 sm:w-48 mb-2" />
            </div>
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                  <Skeleton className="h-4 sm:h-5 flex-1" />
                </div>
              ))}
            </div>
            <div className="bg-primary/5 rounded-xl p-4 sm:p-5 flex flex-col items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full mb-2" />
              <Skeleton className="h-8 sm:h-10 w-16 sm:w-20 mb-2" />
              <Skeleton className="h-4 w-32 sm:w-40" />
            </div>
          </div>
          {/* Assign Button Skeleton */}
          <Skeleton className="h-12 sm:h-14 w-full rounded-lg mb-4" />
          {/* Referred Customers Skeleton */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <Skeleton className="h-5 sm:h-6 w-48 sm:w-56 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-40 sm:w-48" />
                </div>
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate('/employee/agents')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agent Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">
            Failed to Load Agent Details
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">
            Unable to fetch agent information. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm sm:text-base font-semibold">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['employee-agents'] });
            navigate((location.state as LocationState)?.from || '/employee/agents');
          }}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agent Details</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 pt-4">
        {/* Profile Card */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            {agent.profileImgUrl ? (
              <img
                src={agent.profileImgUrl}
                alt={agent.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 ${agent.profileImgUrl ? 'hidden' : ''}`}>
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {agent.name || 'No Name'}
            </h2>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <InfoRow
              icon={<Mail className="w-5 h-5" />}
              value={agent.email}
            />
            <InfoRow
              icon={<Phone className="w-5 h-5" />}
              value={agent.phone}
            />
            {agent.city && (
              <InfoRow
                icon={<MapPin className="w-5 h-5" />}
                value={agent.city}
              />
            )}
            <InfoRow
              icon={<Calendar className="w-5 h-5" />}
              value={`Joined ${formatDate(agent.createdAt)}`}
            />
          </div>

          {/* Stats Card */}
          <div className="bg-primary/5 rounded-xl p-4 sm:p-5 flex flex-col items-center gap-2">
            <Home className="w-8 h-8 text-primary" />
            <p className="text-3xl sm:text-4xl font-bold text-foreground">
              {agent.assignedPropertiesCount || 0}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              {agent.assignedPropertiesCount === 1 ? 'Property Assigned' : 'Properties Assigned'}
            </p>
          </div>
        </div>

        {/* Assign Properties Button */}
        <button
          onClick={() => setShowAssignModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md hover:shadow-lg mb-4"
        >
          <UserPlus className="w-5 h-5" />
          Assign Properties
        </button>

        {/* Referred Customers Section */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Referred Customers ({agent.referredCustomers?.length || 0})
          </h3>
          {!agent.referredCustomers || agent.referredCustomers.length === 0 ? (
            <div className="flex flex-col items-center py-8 sm:py-12">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3" />
              <p className="text-sm sm:text-base text-muted-foreground text-center">
                No customers referred yet
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {agent.referredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className="w-full flex items-center gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                >
                  {customer.profileImgUrl ? (
                    <img
                      src={customer.profileImgUrl}
                      alt={customer.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${customer.profileImgUrl ? 'hidden' : ''}`}>
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {customer.name}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {customer.email}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <EmployeeAssignPropertiesModal
        visible={showAssignModal}
        agentId={agentId!}
        agentName={agent.name}
        onClose={() => setShowAssignModal(false)}
        onSuccess={() => {
          setShowAssignModal(false);
          refetch();
        }}
      />

      <EmployeeCustomerDetailModal
        visible={selectedCustomerId !== null}
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
};

