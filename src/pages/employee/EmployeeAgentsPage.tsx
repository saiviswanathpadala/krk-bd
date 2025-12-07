import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  User,
  X,
  Phone,
  MapPin,
  Building2,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profileImgUrl?: string;
  createdAt: string;
  assignedPropertiesCount: number;
}

const AgentRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm animate-pulse">
    <div className="flex items-center gap-3">
      <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48 mb-2" />
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-24 rounded-lg" />
      </div>
      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
    </div>
  </div>
);

const AgentRow: React.FC<{ 
  agent: Agent; 
  onClick: () => void;
}> = ({ agent, onClick }) => {
  return (
    <div className="w-full bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all">
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 text-left"
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
            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
            {agent.name || 'No Name'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
            {agent.email || 'No Email'}
          </p>
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span className="truncate">{agent.phone}</span>
            </div>
            {agent.city && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{agent.city}</span>
              </div>
            )}
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
            <Building2 className="w-3 h-3" />
            <span>{agent.assignedPropertiesCount} {agent.assignedPropertiesCount === 1 ? 'property' : 'properties'}</span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>
    </div>
  );
};

export const EmployeeAgentsPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Refetch when page comes into focus or location changes (navigating back)
  useEffect(() => {
    if (location.pathname === '/employee/agents') {
      queryClient.invalidateQueries({ queryKey: ['employee-agents'] });
    }
  }, [location.pathname, queryClient]);

  const {
    data: agentsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['employee-agents', debouncedSearch],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await employeeAPI.getAgents(token!, {
          cursor: pageParam || undefined,
          limit: 20,
          q: debouncedSearch || undefined,
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
        console.error('Error fetching agents:', error);
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
    staleTime: 0, // Always refetch to get latest data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const agents = useMemo(() => {
    if (!agentsData?.pages) return [];
    return agentsData.pages.flatMap(page => page?.data || []);
  }, [agentsData]);

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

  const handleAgentClick = (agentId: number) => {
    navigate(`/employee/agents/${agentId}`, {
      state: { from: '/employee/agents' },
      replace: false
    });
  };

  if (isLoading && !agentsData) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/employee/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agents</h1>
          <div className="w-9 sm:w-10" />
        </div>

        <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
          <div className="px-4 sm:px-6 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                disabled
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 mt-3">
          {[...Array(5)].map((_, i) => (
            <AgentRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/employee/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agents</h1>
          <div className="w-9 sm:w-10" />
        </div>

        <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
          <div className="px-4 sm:px-6 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                disabled
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

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
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Agents</h1>
        <div className="w-9 sm:w-10" />
      </div>

      {/* Search - Sticky below header */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
        <div className="px-4 sm:px-6 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents..."
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
      </div>

      {/* Agents List */}
      <div className="px-4 sm:px-6 mt-3">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
            <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              {searchQuery ? `No results for "${searchQuery}"` : 'No agents found'}
            </p>
            {searchQuery && (
              <p className="text-xs sm:text-sm text-muted-foreground/70 text-center mt-1">
                Try adjusting your search terms
              </p>
            )}
          </div>
        ) : (
          <>
            {agents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                onClick={() => handleAgentClick(agent.id)}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={loadMoreRef} className="h-4" />
          </>
        )}
      </div>
    </div>
  );
};

