import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
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
  assigneeId?: number;
  assigneeName?: string;
  slaDueAt?: string;
  isEscalated?: boolean;
  createdAt: string;
}

const LoanRequestRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-4 mb-3 shadow-sm animate-pulse">
    <div className="flex items-center gap-3">
      {/* Icon */}
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* ID + Badge */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        {/* Name */}
        <Skeleton className="h-4 w-32 mb-2" />
        {/* Details */}
        <Skeleton className="h-3 w-40 mb-2" />
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      
      {/* Chevron */}
      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
    </div>
  </div>
);

const LoanRequestRow: React.FC<{ request: LoanRequest; onClick: () => void }> = ({ request, onClick }) => {
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
      onClick={onClick}
      className="w-full bg-card rounded-xl border border-border/50 p-4 mb-3 shadow-sm hover:shadow-md transition-all text-left active:opacity-70"
    >
      <div className="flex items-center gap-3">
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

        {/* Chevron */}
        <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
};

export const EmployeeLoanRequestsPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Refetch when page comes into focus or location changes (navigating back)
  useEffect(() => {
    if (location.pathname === '/employee/loan-requests') {
      queryClient.invalidateQueries({ queryKey: ['employee-loan-requests'] });
    }
  }, [location.pathname, queryClient]);

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
    queryKey: ['employee-loan-requests', activeFilter, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await employeeAPI.getLoanRequests(token!, {
          cursor: pageParam || undefined,
          limit: 20,
          search: debouncedSearch || undefined,
          status: !['all', 'my', 'unassigned'].includes(activeFilter) ? activeFilter : undefined,
        });
        // Ensure we always return a consistent structure
        const data = response?.data || {};
        const result = {
          data: Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []),
          nextCursor: data.nextCursor || null,
        };
        // Ensure data is always an array
        if (!Array.isArray(result.data)) {
          result.data = [];
        }
        return result;
      } catch (error) {
        console.error('Error fetching loan requests:', error);
        return { data: [], nextCursor: null };
      }
    },
    getNextPageParam: (lastPage) => {
      // Safely handle undefined/null lastPage
      if (!lastPage || typeof lastPage !== 'object') {
        return undefined;
      }
      // Check if data exists and is an array
      if (!lastPage.data || !Array.isArray(lastPage.data)) {
        return undefined;
      }
      // Check if data has items (safe length check)
      if (lastPage.data.length === 0) {
        return undefined;
      }
      // Return nextCursor if available
      if (!lastPage.nextCursor || lastPage.nextCursor === null || lastPage.nextCursor === undefined) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    initialPageParam: null as string | null,
    enabled: !!token,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const allRequests = useMemo(() => {
    if (!data?.pages) return [];
    const requests = data.pages.flatMap((page) => page?.data || []);
    
    // Filter by 'my' tickets - only show tickets assigned to current user
    if (activeFilter === 'my') {
      return requests.filter((req) => req.assigneeId !== null && req.assigneeId !== undefined);
    }
    
    return requests;
  }, [data, activeFilter]);

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

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleRequestClick = (requestId: string) => {
    navigate(`/employee/loan-requests/${requestId}`, {
      state: { from: '/employee/loan-requests' },
      replace: false
    });
  };

  // Show loading skeleton - only for list items, not static UI
  if (isLoading && !data) {
    return (
      <div className="min-h-screen pb-8">
        {/* Header - Static, always visible */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/employee/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Requests</h1>
          <div className="w-9 sm:w-10" />
        </div>
        
        {/* Search & Filters - Sticky */}
        <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
          {/* Search - Static, always visible */}
          <div className="px-4 sm:px-6 pt-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, phone, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                disabled
              />
            </div>
          </div>
          
          {/* Filter Chips - Static, always visible */}
          <div className="px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'all', label: 'All' },
                { key: 'my', label: 'My Tickets' },
                { key: 'received', label: 'Received' },
                { key: 'under_review', label: 'Under Review' },
                { key: 'contacted', label: 'Contacted' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  disabled
                  className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* List Skeleton - Only dynamic content */}
        <div className="px-4 sm:px-6 mt-3">
          {[...Array(5)].map((_, i) => (
            <LoanRequestRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen pb-8">
        {/* Header */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/employee/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Requests</h1>
          <div className="w-9 sm:w-10" />
        </div>
        
        {/* Error State */}
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Failed to Load Requests</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
              Unable to fetch loan requests. Please check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto shadow-md hover:shadow-lg active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{isRefetching ? 'Retrying...' : 'Try Again'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
        <button
          onClick={() => navigate('/employee/home')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Requests</h1>
        <div className="w-9 sm:w-10" />
      </div>

      {/* Search & Filters - Sticky */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
        {/* Search */}
        <div className="px-4 sm:px-6 pt-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { key: 'all', label: 'All' },
              { key: 'my', label: 'My Tickets' },
              { key: 'received', label: 'Received' },
              { key: 'under_review', label: 'Under Review' },
              { key: 'contacted', label: 'Contacted' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all disabled:opacity-50 flex-shrink-0 ${
                  activeFilter === filter.key
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loan Requests List */}
      <div className="px-4 sm:px-6 mt-3">
        {allRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-2">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : activeFilter === 'my'
                ? 'No tickets assigned to you'
                : activeFilter !== 'all'
                ? `No ${activeFilter.replace('_', ' ')} requests`
                : 'No loan requests found'
              }
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
                onClick={() => handleRequestClick(request.id)}
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
    </div>
  );
};

