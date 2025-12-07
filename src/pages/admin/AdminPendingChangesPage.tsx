import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  FileText,
  X,
  Building2,
  Image,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminListHeader } from '@/components/admin/AdminListHeader';

interface PendingChange {
  id: string;
  type: 'property' | 'banner';
  targetId: number;
  proposerId: number;
  proposerName?: string;
  proposerEmail?: string;
  proposerAvatar?: string;
  targetTitle?: string;
  targetThumbnail?: string;
  diffSummary?: string;
  status: string;
  reason?: string;
  createdAt: string;
  reviewedAt?: string;
}

const PendingChangeRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-4 mb-3 shadow-sm">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right">
        <Skeleton className="h-3 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);

const PendingChangeRow: React.FC<{ change: PendingChange; onClick: () => void }> = ({ change, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeIcon = () => {
    return change.type === 'property' ? (
      <Building2 className="w-6 h-6 text-primary" />
    ) : (
      <Image className="w-6 h-6 text-primary" />
    );
  };

  const statusColors: Record<string, string> = {
    pending: '#FF9800',
    needs_revision: '#F44336',
    approved: '#4CAF50',
    rejected: '#F44336',
    draft: '#9E9E9E',
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-xl border border-border/50 p-4 mb-3 shadow-sm hover:shadow-md transition-all text-left active:opacity-70"
    >
      <div className="flex items-center gap-3">
        {/* Icon/Thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {change.targetThumbnail ? (
            <img
              src={change.targetThumbnail}
              alt={change.targetTitle || 'Thumbnail'}
              className="w-full h-full object-cover"
            />
          ) : (
            getTypeIcon()
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-foreground truncate">
              {change.targetTitle || `${change.type} #${change.targetId}`}
            </h3>
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: statusColors[change.status] || '#999' }}
            >
              {change.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate mb-1">
            {change.proposerName || 'Unknown'} • {change.type}
          </p>
          {change.diffSummary && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {change.diffSummary}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(change.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

export const AdminPendingChangesPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'property' | 'banner'>('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    queryKey: ['admin-pending-changes', debouncedSearch, typeFilter],
    queryFn: async ({ pageParam }) => {
      const response = await adminAPI.getPendingChanges(token!, {
        cursor: pageParam,
        limit: 20,
        q: debouncedSearch || undefined,
        type: typeFilter,
        status: 'pending',
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!token,
    initialPageParam: undefined as string | undefined,
  });

  const allChanges = data?.pages.flatMap((page) => page.data || []) || [];

  // Infinite scroll observer
  const observer = useRef<IntersectionObserver | undefined>(undefined);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  if (error) {
    const isConnectionError = (error as any)?.code === 'ECONNREFUSED' || 
                              (error as any)?.message?.includes('Network Error') ||
                              (error as any)?.response === undefined;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AdminListHeader title="Pending Changes" backPath="/admin/home" />
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 max-w-md mx-4 mt-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            {isConnectionError ? 'Backend Server Not Running' : 'Failed to Load Pending Changes'}
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            {isConnectionError 
              ? 'Please make sure the backend server is running on port 3000.'
              : 'Unable to fetch pending changes. Please check your connection and try again.'}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <AdminListHeader title="Pending Changes" backPath="/admin/home" />

      {/* Filters */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              typeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('property')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              typeFilter === 'property'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setTypeFilter('banner')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              typeFilter === 'banner'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            Banners
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pending changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <PendingChangeRowSkeleton key={i} />
            ))}
          </>
        ) : allChanges.length === 0 ? (
          <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No pending changes found matching your search.' : 'No pending changes to review.'}
            </p>
          </div>
        ) : (
          <>
            {allChanges.map((change, index) => (
              <div
                key={change.id}
                ref={index === allChanges.length - 1 ? lastElementRef : null}
              >
                <PendingChangeRow
                  change={change}
                  onClick={() => {
                    // Navigate to property/banner detail page like employees do
                    if (change.type === 'property') {
                      // If targetId exists, it's a change to an existing property, otherwise it's a new property
                      const targetId = change.targetId || change.id;
                      navigate(`/admin/properties/${targetId}`, {
                        state: {
                          changeId: change.id,
                          isPendingChange: true,
                        },
                      });
                    } else if (change.type === 'banner') {
                      // If targetId exists, it's a change to an existing banner, otherwise it's a new banner
                      const targetId = change.targetId || change.id;
                      navigate(`/admin/banners/${targetId}`, {
                        state: {
                          changeId: change.id,
                          isPendingChange: true,
                        },
                      });
                    }
                  }}
                />
              </div>
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
            {!hasNextPage && allChanges.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No more pending changes to load
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
