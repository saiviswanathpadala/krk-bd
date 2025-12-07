import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Briefcase,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profileImgUrl?: string;
  approved: boolean;
  createdAt: string;
  lastLogin?: string;
}

const AgentRowSkeleton: React.FC<{ showActions?: boolean }> = ({ showActions = false }) => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm">
    <div className="flex items-center gap-2 sm:gap-3">
      <Skeleton className="w-14 h-14 rounded-full flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 sm:w-40 mb-2 animate-pulse" />
        <Skeleton className="h-3 w-40 sm:w-48 mb-1 animate-pulse" />
        <Skeleton className="h-3 w-20 sm:w-24 animate-pulse" />
      </div>
      <div className="text-right flex-shrink-0 hidden sm:block">
        <Skeleton className="h-3 w-16 sm:w-20 mb-1 animate-pulse" />
        <Skeleton className="h-3 w-12 sm:w-16 animate-pulse" />
      </div>
      <Skeleton className="w-5 h-5 rounded flex-shrink-0 animate-pulse" />
      {showActions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="w-8 h-8 rounded-lg animate-pulse" />
          <Skeleton className="w-8 h-8 rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  </div>
);

const AgentRow: React.FC<{ 
  agent: Agent; 
  onClick: () => void;
  onApprove: (e: React.MouseEvent) => void;
  onReject: (e: React.MouseEvent) => void;
  isProcessing: boolean;
  processingAction: 'approve' | 'reject' | null;
}> = ({ agent, onClick, onApprove, onReject, isProcessing, processingAction }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onClick}
          className="flex-1 flex items-center gap-2 sm:gap-3 text-left"
        >
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
            {agent.profileImgUrl ? (
              <img
                src={agent.profileImgUrl}
                alt={agent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#00a699]/20 flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-[#00a699]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                {agent.name || 'No Name'}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
              {agent.email || 'No Email'}
            </p>
            <p className="text-xs text-muted-foreground">
              {agent.phone}
            </p>
          </div>

          {/* Meta */}
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
              {agent.city || 'No City'}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(agent.createdAt)}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>

        {/* Action Buttons - Only show for pending agents */}
        {!agent.approved && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex-shrink-0"
              title="Approve Agent"
            >
              {isProcessing && processingAction === 'approve' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onReject}
              disabled={isProcessing}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex-shrink-0"
              title="Reject Agent"
            >
              {isProcessing && processingAction === 'reject' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminAgentsPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: agentsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin-agents', activeTab, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const response = await adminAPI.getAgents(token!, {
        status: activeTab,
        limit: 20,
        cursor: pageParam || undefined,
        q: debouncedSearch || undefined,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
    enabled: !!token,
    staleTime: 30000,
  });

  const agents: Agent[] = agentsData?.pages.flatMap((page) => page.data) || [];

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminAPI.approveAgent(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Agent approved successfully');
      setProcessingId(null);
      setProcessingAction(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve agent');
      setProcessingId(null);
      setProcessingAction(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason, action }: { id: number; reason: string; action: 'delete' | 'retain' }) => 
      adminAPI.rejectAgent(token!, id, { reason, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Agent rejected successfully');
      setProcessingId(null);
      setProcessingAction(null);
      setShowRejectModal(false);
      setSelectedAgent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject agent');
      setProcessingId(null);
      setProcessingAction(null);
    },
  });

  const handleAgentClick = (agentId: number) => {
    navigate(`/admin/agents/${agentId}`);
  };

  const handleApprove = (e: React.MouseEvent, agentId: number) => {
    e.stopPropagation();
    setProcessingId(agentId);
    setProcessingAction('approve');
    approveMutation.mutate(agentId);
  };

  const handleReject = (e: React.MouseEvent, agentId: number) => {
    e.stopPropagation();
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setShowRejectModal(true);
    }
  };

  const handleRejectSubmit = (reason: string, action: 'delete' | 'retain') => {
    if (selectedAgent) {
      setProcessingId(selectedAgent.id);
      setProcessingAction('reject');
      rejectMutation.mutate({ id: selectedAgent.id, reason, action });
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header - Static, doesn't reload */}
      <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => navigate('/admin/home')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agent Management</h1>
        <div className="w-9 sm:w-10" />
      </header>

      {/* Tabs */}
      <div className="px-4 sm:px-6 pt-3 pb-2">
        <div className="flex bg-card rounded-xl overflow-hidden mb-4">
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 py-3 text-center font-semibold text-sm sm:text-base transition-colors relative ${
              activeTab === 'approved'
                ? 'text-[#0a66c2]'
                : 'text-muted-foreground'
            }`}
          >
            Approved
            {activeTab === 'approved' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a66c2]" style={{ height: '3px' }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-center font-semibold text-sm sm:text-base transition-colors relative ${
              activeTab === 'pending'
                ? 'text-[#0a66c2]'
                : 'text-muted-foreground'
            }`}
          >
            Pending
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0a66c2]" style={{ height: '3px' }} />
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[60px] z-10 pb-3 pt-3 border-b border-border/30">
        <div className="px-4 sm:px-6 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone, city"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="px-4 sm:px-6 mt-3">
        {isLoading ? (
          <div>
            {[...Array(5)].map((_, i) => (
              <AgentRowSkeleton key={i} showActions={activeTab === 'pending'} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center px-4 py-12 sm:py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Failed to Load Agents</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Unable to fetch agents. Please check your connection and try again.</p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mx-auto shadow-md hover:shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm sm:text-base font-semibold">Try Again</span>
              </button>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
            <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              {searchQuery ? `No results for "${searchQuery}"` : `No ${activeTab} agents found`}
            </p>
            {searchQuery && (
              <p className="text-xs sm:text-sm text-muted-foreground/70 text-center mt-1">
                Try adjusting your search terms
              </p>
            )}
          </div>
        ) : (
          <div>
            {agents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                onClick={() => handleAgentClick(agent.id)}
                onApprove={(e) => handleApprove(e, agent.id)}
                onReject={(e) => handleReject(e, agent.id)}
                isProcessing={processingId === agent.id}
                processingAction={processingId === agent.id ? processingAction : null}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={loadMoreRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !rejectMutation.isPending && setShowRejectModal(false)}>
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Reject Agent</h2>
                <button
                  onClick={() => !rejectMutation.isPending && setShowRejectModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={rejectMutation.isPending}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Rejecting <span className="font-semibold text-foreground">{selectedAgent.name}</span>
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reason = formData.get('reason') as string;
                const action = formData.get('action') as 'delete' | 'retain';
                if (reason.trim()) {
                  handleRejectSubmit(reason.trim(), action);
                }
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reason for rejection *
                  </label>
                  <textarea
                    name="reason"
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Enter reason for rejection..."
                    disabled={rejectMutation.isPending}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Action
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="retain"
                        defaultChecked
                        className="w-4 h-4 text-primary"
                        disabled={rejectMutation.isPending}
                      />
                      <span className="text-sm text-foreground">Retain account (agent can reapply)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="action"
                        value="delete"
                        className="w-4 h-4 text-destructive"
                        disabled={rejectMutation.isPending}
                      />
                      <span className="text-sm text-foreground">Delete account permanently</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                    disabled={rejectMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      'Reject Agent'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
