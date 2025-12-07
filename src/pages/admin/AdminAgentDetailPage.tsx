import React, { useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageCircle,
  User,
  AlertCircle,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const personChatAPI = {
  createOrGetConversation: (token: string, participantId: number) =>
    axios.post(`${API_BASE_URL}/chat/person/conversations`, { participantId }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profileImgUrl?: string;
  profileCompleted: boolean;
  role: string;
  approved: boolean;
  approvedAt?: string;
  rejectedReason?: string;
  rejectedAt?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  referredCustomers: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    profileImgUrl?: string;
  }>;
}

const DetailSkeleton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const returnTo = (location.state as any)?.returnTo || '/admin/agents';
  
  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
            navigate(returnTo);
          }}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agent Details</h1>
        <div className="w-9 sm:w-10" />
      </div>
      
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4" />
            <Skeleton className="h-6 sm:h-7 w-40 sm:w-48 mb-3" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-12 w-48 rounded-full" />
          </div>
          
          <div className="border-t border-border pt-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
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
              
              <div>
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
            </div>
            
            <Skeleton className="h-5 sm:h-6 w-48 mb-4 border-t border-border pt-6" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
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

export const AdminAgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const agentId = id ? parseInt(id) : null;
  const returnTo = (location.state as any)?.returnTo || '/admin/agents';
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const {
    data: agent,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<Agent>({
    queryKey: ['admin-agent', agentId],
    queryFn: async () => {
      const response = await adminAPI.getAgentById(token!, agentId!);
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

  const approveMutation = useMutation({
    mutationFn: () => adminAPI.approveAgent(token!, agentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Agent approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve agent');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ reason, action }: { reason: string; action: 'delete' | 'retain' }) => 
      adminAPI.rejectAgent(token!, agentId!, { reason, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Agent rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject agent');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deleteAgent(token!, agentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Agent deleted successfully');
      navigate(returnTo);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
    setShowApproveModal(false);
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      rejectMutation.mutate({ reason: rejectReason.trim(), action: 'retain' });
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

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

  if (error || (!agent && !isLoading)) {
    const isConnectionError = (error as any)?.code === 'ECONNREFUSED' || 
                              (error as any)?.message?.includes('Network Error') ||
                              (error as any)?.response === undefined;
    
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate('/admin/agents')}
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
            {isConnectionError ? 'Backend Server Not Running' : 'Agent Not Found'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">
            {isConnectionError 
              ? 'Please make sure the backend server is running on port 3000.'
              : "The agent you're looking for doesn't exist or has been deleted."}
          </p>
          <button
            onClick={() => isConnectionError ? refetch() : navigate('/admin/agents')}
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
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
            navigate(returnTo);
          }}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agent Details</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4">
              {agent.profileImgUrl ? (
                <img
                  src={agent.profileImgUrl}
                  alt={agent.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center ${agent.profileImgUrl ? 'hidden' : ''}`}>
                <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 text-center">
              {agent.name || 'No Name Provided'}
            </h2>

            <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
              <span
                className={`px-4 py-2 text-xs font-semibold rounded-full text-white ${
                  agent.approved ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
              >
                {agent.approved ? 'Approved' : 'Pending Approval'}
              </span>
              <span className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-full capitalize">
                {agent.role}
              </span>
            </div>

            {!agent.approved && (
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setShowApproveModal(true)}
                  disabled={approveMutation.isPending}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#10B981] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejectMutation.isPending}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F59E0B] text-white rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            )}
            {agent.approved && (
              <button
                onClick={async () => {
                  try {
                    const response = await personChatAPI.createOrGetConversation(token!, agent.id);
                    navigate('/chat', {
                      state: {
                        participantId: agent.id,
                        participantName: agent.name,
                        participantRole: 'agent',
                        participantProfileImg: agent.profileImgUrl,
                      }
                    });
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || 'Failed to open chat');
                  }
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Agent
              </button>
            )}
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                <InfoRow
                  icon={<Mail className="w-5 h-5" />}
                  label="Email Address"
                  value={agent.email}
                />
                <InfoRow
                  icon={<Phone className="w-5 h-5" />}
                  label="Phone Number"
                  value={agent.phone}
                />
                <InfoRow
                  icon={<MapPin className="w-5 h-5" />}
                  label="City"
                  value={agent.city}
                />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Account Information</h3>
                <InfoRow
                  icon={<Calendar className="w-5 h-5" />}
                  label="Joined Date"
                  value={formatDate(agent.createdAt)}
                />
                <InfoRow
                  icon={<Clock className="w-5 h-5" />}
                  label="Last Login"
                  value={formatLastLogin(agent.lastLogin)}
                />
                <InfoRow
                  icon={<RefreshCw className="w-5 h-5" />}
                  label="Last Updated"
                  value={formatDate(agent.updatedAt)}
                />
                {agent.approvedAt && (
                  <InfoRow
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    label="Approved At"
                    value={formatDate(agent.approvedAt)}
                  />
                )}
                {agent.rejectedReason && (
                  <InfoRow
                    icon={<XCircle className="w-5 h-5" />}
                    label="Rejection Reason"
                    value={agent.rejectedReason}
                  />
                )}
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 border-t border-border pt-6">
              Referred Customers ({agent.referredCustomers.length})
            </h3>
            {agent.referredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3" />
                <p className="text-sm sm:text-base text-muted-foreground text-center">No customers referred</p>
              </div>
            ) : (
              <div className="space-y-0">
                {agent.referredCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    to={`/admin/customers/${customer.id}`}
                    state={{ returnTo: `/admin/agents/${agentId}` }}
                    className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-foreground truncate">{customer.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{customer.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
              Delete Agent
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApprove}
        title="Approve Agent"
        message={`Are you sure you want to approve ${agent?.name || 'this agent'}?`}
        confirmText="Approve"
        confirmVariant="primary"
        isLoading={approveMutation.isPending}
      />
      
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4">Reject Agent</h2>
            <p className="text-muted-foreground mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary mb-6"
              rows={3}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="px-4 py-2 rounded-lg font-medium text-white bg-[#F59E0B] hover:bg-[#F59E0B]/90 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Agent"
        message={`Are you sure you want to delete ${agent?.name || 'this agent'}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
