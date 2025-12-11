import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  FileText,
  X,
  Clock,
  User,
  Loader2,
  ArrowLeft,
  CheckSquare,
  Square,
  Users,
  AlertTriangle,
  Check,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

interface LoanRequest {
  id: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  loanType: string;
  loanAmountNeeded: number;
  propertyCategory: string;
  status: string;
  priority?: string;
  assigneeId?: number;
  assigneeName?: string;
  slaDueAt?: string;
  isEscalated?: boolean;
  createdAt: string;
}

const LoanRequestRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm">
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Icon */}
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0 animate-pulse" />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* ID + Badge */}
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-3 w-16 sm:w-20 animate-pulse" />
          <Skeleton className="h-5 w-14 sm:w-16 rounded-full animate-pulse" />
        </div>
        {/* Name */}
        <Skeleton className="h-4 w-28 sm:w-32 mb-1 animate-pulse" />
        {/* Details */}
        <Skeleton className="h-3 w-36 sm:w-40 mb-2 animate-pulse" />
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-6 w-18 sm:w-20 rounded-full animate-pulse" />
          <Skeleton className="h-3 w-20 sm:w-24 animate-pulse" />
          <Skeleton className="h-3 w-16 sm:w-20 animate-pulse" />
        </div>
      </div>
      
      {/* Clock */}
      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 animate-pulse" />
    </div>
  </div>
);

const LoanRequestRow: React.FC<{ 
  request: LoanRequest; 
  onClick: () => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  selectionMode: boolean;
}> = ({ request, onClick, isSelected, onSelect, selectionMode }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const statusColors: Record<string, string> = {
    received: '#FF9800',
    under_review: '#2196F3',
    contacted: '#9C27B0',
    closed: '#4CAF50',
    rejected: '#F44336',
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const isOverdue = request.slaDueAt && new Date(request.slaDueAt) < new Date() && !['closed', 'rejected'].includes(request.status);

  return (
    <button
      onClick={selectionMode ? () => onSelect(request.id) : onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onSelect(request.id);
      }}
      className={`w-full bg-card rounded-xl border p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all text-left active:opacity-70 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border/50'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {selectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(request.id);
            }}
            className="flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary" />
            ) : (
              <Square className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        )}
        {/* Icon */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ID + Badges */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">#{request.id.substring(0, 8)}</span>
            {isOverdue && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-destructive text-white rounded-full">
                <AlertCircle className="w-3 h-3" />
                Overdue
              </span>
            )}
            {request.isEscalated && (
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-600 rounded-full">
                Escalated
              </span>
            )}
          </div>
          
          {/* Name */}
          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
            {request.userName}
          </h3>
          {/* Details */}
          <p className="text-xs sm:text-sm text-muted-foreground truncate mb-2">
            {request.loanType} • {formatAmount(request.loanAmountNeeded)} • {request.propertyCategory}
          </p>
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: statusColors[request.status] || '#999' }}
            >
              {formatStatus(request.status)}
            </span>
            {request.assigneeName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{request.assigneeName}</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(request.createdAt)}
            </span>
          </div>
        </div>

        {/* Clock */}
        <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};

export const AdminLoanRequestsPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'reassign' | 'escalate' | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch stats for filter counts
  const { data: stats } = useQuery({
    queryKey: ['admin-loan-request-stats'],
    queryFn: async () => {
      const response = await adminAPI.getLoanRequestStats(token!);
      return response.data;
    },
    enabled: !!token,
    staleTime: 30000,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['admin-loan-requests', activeFilter, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const params: any = {
        cursor: pageParam,
        limit: 20,
        search: debouncedSearch || undefined,
      };

      // Handle special filters
      if (activeFilter === 'unassigned') {
        params.assignee = 'unassigned';
      } else if (activeFilter === 'escalated') {
        params.priority = 'high';
      } else if (activeFilter === 'overdue') {
        params.slaState = 'overdue';
      } else if (activeFilter !== 'all') {
        // For status filters: under_review, contacted, closed, rejected
        params.status = activeFilter;
      }

      const response = await adminAPI.getLoanRequests(token!, params);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!token,
    initialPageParam: undefined as string | undefined,
    staleTime: 30000,
  });

  const allRequests = React.useMemo(() => {
    const requests = data?.pages.flatMap((page) => page.data || []) || [];
    
    // Client-side filtering for escalated to ensure accuracy
    if (activeFilter === 'escalated') {
      return requests.filter(req => req.isEscalated === true);
    }
    
    // Client-side filtering for overdue to exclude closed/rejected
    if (activeFilter === 'overdue') {
      return requests.filter(req => {
        const isOverdue = req.slaDueAt && new Date(req.slaDueAt) < new Date();
        const isNotClosed = !['closed', 'rejected'].includes(req.status);
        return isOverdue && isNotClosed;
      });
    }
    
    return requests;
  }, [data, activeFilter]);

  const handleSelectRequest = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        if (newSet.size === 0) setSelectionMode(false);
      } else {
        newSet.add(id);
        if (!selectionMode) setSelectionMode(true);
      }
      return newSet;
    });
  }, [selectionMode]);

  const bulkReassignMutation = useMutation({
    mutationFn: (data: { assigneeId?: number; autoAssign?: boolean }) =>
      adminAPI.bulkReassignLoanRequests(token!, { ids: Array.from(selectedIds), ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loan-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-loan-request-stats'] });
      toast.success(`${selectedIds.size} request(s) reassigned successfully`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowBulkActionsModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reassign requests');
    },
  });

  const bulkEscalateMutation = useMutation({
    mutationFn: (reason: string) =>
      adminAPI.bulkEscalateLoanRequests(token!, { ids: Array.from(selectedIds), reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loan-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-loan-request-stats'] });
      toast.success(`${selectedIds.size} request(s) escalated successfully`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowBulkActionsModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to escalate requests');
    },
  });

  useEffect(() => {
    if (selectedIds.size === 0) {
      setSelectionMode(false);
    }
  }, [selectedIds]);

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

  const isConnectionError = error && ((error as any)?.code === 'ECONNREFUSED' || 
                            (error as any)?.message?.includes('Network Error') ||
                            (error as any)?.response === undefined);

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
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Requests</h1>
        <div className="w-9 sm:w-10" />
      </header>

      {/* Search & Filters - Sticky */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[60px] z-10 pb-3 border-b border-border/30">
        {/* Search */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {searchQuery && (
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

        {/* Selection Bar */}
        {selectionMode && selectedIds.size > 0 && (
          <div className="bg-primary/10 border-y border-primary/20 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-foreground">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setBulkAction('reassign');
                  setShowBulkActionsModal(true);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Reassign</span>
              </button>
              <button
                onClick={() => {
                  setBulkAction('escalate');
                  setShowBulkActionsModal(true);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Escalate</span>
              </button>
              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  setSelectionMode(false);
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary text-secondary-foreground rounded-lg text-xs sm:text-sm font-semibold hover:bg-secondary/90 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter Chips */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { key: 'all', label: 'All', count: stats?.total },
            { key: 'unassigned', label: 'Unassigned', count: stats?.unassigned },
            { key: 'escalated', label: 'Escalated', count: stats?.escalated },
            { key: 'overdue', label: 'Overdue', count: stats?.overdue },
            { key: 'under_review', label: 'Under Review' },
            { key: 'contacted', label: 'Contacted' },
            { key: 'closed', label: 'Closed' },
            { key: 'rejected', label: 'Rejected' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              disabled={isLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all disabled:opacity-50 flex-shrink-0 ${
                activeFilter === filter.key
                  ? 'bg-black text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.label} {filter.count !== undefined ? (
                stats ? `(${filter.count})` : (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-1" />
                )
              ) : null}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Loan Requests List */}
      <div className="px-4 sm:px-6 mt-3">
        {error ? (
          <div className="flex items-center justify-center px-4 py-12 sm:py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                {isConnectionError ? 'Backend Server Not Running' : 'Failed to Load Loan Requests'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                {isConnectionError 
                  ? 'Please make sure the backend server is running on port 3000.'
                  : 'Unable to fetch loan requests. Please check your connection and try again.'}
              </p>
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mx-auto shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="text-sm sm:text-base font-semibold">{isRefetching ? 'Retrying...' : 'Try Again'}</span>
              </button>
            </div>
          </div>
        ) :
        isLoading && allRequests.length === 0 ? (
          <>
            {[...Array(5)].map((_, i) => (
              <LoanRequestRowSkeleton key={i} />
            ))}
          </>
        ) : allRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-2">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : activeFilter !== 'all'
                ? `No ${activeFilter.replace('_', ' ')} requests`
                : 'No loan requests found'}
            </p>
            {searchQuery && (
              <p className="text-xs sm:text-sm text-muted-foreground/70 text-center">
                Try adjusting your search terms
              </p>
            )}
          </div>
        ) : (
          <>
            {allRequests.map((request) => (
              <LoanRequestRow
                key={request.id}
                request={request}
                onClick={() => navigate(`/admin/loan-requests/${request.id}`)}
                isSelected={selectedIds.has(request.id)}
                onSelect={handleSelectRequest}
                selectionMode={selectionMode}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={loadMoreRef} className="h-4" />
          </>
        )}
      </div>

      {/* Bulk Actions Modal */}
      <Dialog open={showBulkActionsModal} onOpenChange={setShowBulkActionsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'reassign' ? 'Bulk Reassign' : 'Bulk Escalate'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'reassign' 
                ? `Reassign ${selectedIds.size} selected request(s) to an employee.`
                : `Escalate ${selectedIds.size} selected request(s) with a reason.`}
            </DialogDescription>
          </DialogHeader>
          {bulkAction === 'reassign' ? (
            <BulkReassignForm
              onReassign={(assigneeId) => {
                bulkReassignMutation.mutate({ assigneeId });
              }}
              onCancel={() => setShowBulkActionsModal(false)}
              isPending={bulkReassignMutation.isPending}
            />
          ) : (
            <BulkEscalateForm
              onEscalate={(reason) => {
                bulkEscalateMutation.mutate(reason);
              }}
              onCancel={() => setShowBulkActionsModal(false)}
              isPending={bulkEscalateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Bulk Reassign Form Component
const BulkReassignForm: React.FC<{
  onReassign: (assigneeId: number) => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ onReassign, onCancel, isPending }) => {
  const { token } = useAuthStore();
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: employeesResponse } = useQuery({
    queryKey: ['finance-employees', employeeSearch],
    queryFn: async () => {
      const response = await adminAPI.getFinanceEmployees(token!, employeeSearch);
      return response.data;
    },
    enabled: !!token && isOpen,
    staleTime: 60000,
  });

  const employees = employeesResponse?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Employee
        </label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-lg bg-background text-foreground">
              <span className={selectedEmployee ? 'text-foreground' : 'text-muted-foreground'}>
                {selectedEmployee?.name || 'Select employee...'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 border border-border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {employees.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No employees found
                </div>
              ) : (
                employees.map((emp: any) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    {selectedEmployee?.id === emp.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                    <span className={selectedEmployee?.id === emp.id ? 'font-semibold' : ''}>
                      {emp.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (selectedEmployee) {
              onReassign(selectedEmployee.id);
            }
          }}
          disabled={!selectedEmployee || isPending}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Reassign
        </Button>
      </DialogFooter>
    </div>
  );
};

// Bulk Escalate Form Component
const BulkEscalateForm: React.FC<{
  onEscalate: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ onEscalate, onCancel, isPending }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Escalation Reason *
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for escalation (minimum 10 characters)..."
          rows={4}
          className="resize-none"
        />
        {reason.length > 0 && reason.length < 10 && (
          <p className="text-xs text-destructive mt-1">
            Reason must be at least 10 characters
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (reason.trim().length >= 10) {
              onEscalate(reason.trim());
            }
          }}
          disabled={reason.trim().length < 10 || isPending}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Escalate
        </Button>
      </DialogFooter>
    </div>
  );
};
