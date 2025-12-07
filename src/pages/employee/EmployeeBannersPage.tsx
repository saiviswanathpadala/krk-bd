import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  X,
  Plus,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  targetRole: string;
  isActive: boolean;
  displayOrder: number;
  status: string;
  createdAt: string;
  isPendingChange?: boolean;
}

const BannerRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm animate-pulse">
    <div className="flex items-center gap-2 sm:gap-3">
      <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-28 sm:w-32 mb-2" />
        <Skeleton className="h-3 w-36 sm:w-48 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      </div>
    </div>
  </div>
);

const BannerRow: React.FC<{ 
  banner: Banner; 
  onClick: () => void;
}> = ({ banner, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusBadge = banner.status === 'pending'
    ? { label: 'Pending Approval', color: 'bg-orange-500' }
    : banner.status === 'drafts'
    ? { label: 'Draft', color: 'bg-gray-500' }
    : banner.status === 'needs_revision'
    ? { label: 'Requested Changes', color: 'bg-yellow-500' }
    : null;

  const borderClass = banner.status === 'pending' 
    ? 'border-orange-500 border-2' 
    : banner.status === 'needs_revision'
    ? 'border-yellow-500 border-2'
    : banner.status === 'drafts' 
    ? 'border-gray-500 border-2' 
    : 'border-border/50';

  return (
    <div className={`w-full bg-card rounded-xl border ${borderClass} p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all`}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2 sm:gap-3 text-left"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=Banner';
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
            {banner.title || 'No Title'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate mb-2">
            {banner.subtitle || 'No Subtitle'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge ? (
              <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            ) : (
              <>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {banner.targetRole}
                </span>
                {banner.isActive ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">
                    <Eye className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-500 text-white rounded text-xs font-semibold">
                    <EyeOff className="w-3 h-3" />
                    Inactive
                  </span>
                )}
              </>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(banner.createdAt)}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export const EmployeeBannersPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filterFromUrl = searchParams.get('filter') as 'all' | 'active' | 'inactive' | 'pending' | 'needs_revision' | 'drafts' | null;
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'pending' | 'needs_revision' | 'drafts'>(filterFromUrl || 'drafts');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (location.pathname === '/employee/banners') {
      queryClient.refetchQueries({ queryKey: ['employee-banners'], exact: false });
      queryClient.refetchQueries({ queryKey: ['employee-banner-pending-changes'], exact: false });
    }
  }, [location.pathname, queryClient]);

  useEffect(() => {
    const filterFromUrl = searchParams.get('filter') as 'all' | 'active' | 'inactive' | 'pending' | 'needs_revision' | 'drafts' | null;
    if (filterFromUrl) {
      setActiveFilter(filterFromUrl);
    } else if ((location.state as any)?.activeFilter && location.key !== 'default') {
      setActiveFilter((location.state as any).activeFilter);
      setSearchParams({ filter: (location.state as any).activeFilter });
    }
  }, [location.state, location.key, searchParams, setSearchParams]);

  const {
    data: bannersData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['employee-banners', activeFilter, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await employeeAPI.getBanners(token!, {
          cursor: pageParam || undefined,
          limit: 20,
          category: activeFilter !== 'all' ? activeFilter : undefined,
          q: debouncedSearch || undefined,
        });
        const data = response?.data || {};
        const result = {
          data: Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []),
          nextCursor: data.nextCursor || null,
        };
        if (!Array.isArray(result.data)) {
          result.data = [];
        }
        return result;
      } catch (error) {
        console.error('Error fetching banners:', error);
        return { data: [], nextCursor: null };
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || typeof lastPage !== 'object') {
        return undefined;
      }
      if (!lastPage.data || !Array.isArray(lastPage.data)) {
        return undefined;
      }
      if (lastPage.data.length === 0) {
        return undefined;
      }
      if (!lastPage.nextCursor || lastPage.nextCursor === null || lastPage.nextCursor === undefined) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    initialPageParam: null as string | null,
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: allPendingChanges } = useQuery({
    queryKey: ['employee-all-banner-pending-changes'],
    queryFn: async () => {
      const response = await employeeAPI.getBannerPendingChanges(token!, { limit: 100 });
      return response.data.data;
    },
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const allBanners = useMemo(() => {
    if (!bannersData?.pages) return [];
    return bannersData.pages.flatMap(page => page?.data || []);
  }, [bannersData]);

  const banners = useMemo(() => {
    interface BannerPendingChange {
      id: string;
      bannerId?: number | string;
      status: string;
      isDraft?: boolean;
      proposedPayload?: any;
      createdAt?: string;
    }
    
    const pendingChangesMap = new Map(
      allPendingChanges?.filter((c: BannerPendingChange) => c.bannerId && !c.isDraft && c.status === 'pending').map((change: BannerPendingChange) => [change.bannerId, change]) || []
    );

    const processedBanners = allBanners.map(banner => ({
      ...banner,
      isPendingChange: pendingChangesMap.has(banner.id),
    }));

    // Add pending changes as separate items for 'all', 'pending', and 'needs_revision' filters
    const pendingChangeBanners = (allPendingChanges || []).filter((c: BannerPendingChange) => 
      !c.isDraft && (c.status === 'pending' || c.status === 'needs_revision')
    ).map((change: BannerPendingChange) => ({
      id: change.id,
      imageUrl: change.proposedPayload?.imageUrl || '',
      title: change.proposedPayload?.title || 'Banner',
      subtitle: change.proposedPayload?.subtitle || '',
      targetRole: change.proposedPayload?.targetRole || 'All',
      isActive: change.proposedPayload?.isActive || false,
      displayOrder: change.proposedPayload?.displayOrder || 0,
      status: change.status,
      createdAt: change.createdAt || new Date().toISOString(),
      isPendingChange: true,
      bannerId: change.bannerId,
    }));

    let filtered = processedBanners;

    if (activeFilter === 'all') {
      filtered = [...pendingChangeBanners, ...processedBanners.filter(b => b.status !== 'drafts')];
    } else if (activeFilter === 'pending') {
      filtered = pendingChangeBanners.filter(b => b.status === 'pending');
    } else if (activeFilter === 'drafts') {
      filtered = filtered.filter(b => b.status === 'drafts');
    } else if (activeFilter === 'needs_revision') {
      filtered = pendingChangeBanners.filter(b => b.status === 'needs_revision');
    } else if (activeFilter === 'active') {
      filtered = filtered.filter(b => b.isActive && b.status !== 'pending' && b.status !== 'drafts' && b.status !== 'needs_revision');
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(b => !b.isActive && b.status !== 'pending' && b.status !== 'drafts' && b.status !== 'needs_revision');
    }

    return filtered;
  }, [allBanners, allPendingChanges, activeFilter]);

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

  const handleBannerClick = (banner: Banner & { bannerId?: string; isDraft?: boolean }) => {
    if (banner.isDraft || banner.status === 'drafts') {
      const draftData = allPendingChanges?.find((c: any) => c.id === banner.id);
      navigate(`/employee/banners/${banner.id}/edit`, {
        state: { 
          from: '/employee/banners',
          activeFilter,
          changeId: banner.id,
          isDraft: true,
          draftData: draftData?.proposedPayload
        },
        replace: false
      });
    } else if (banner.status === 'needs_revision') {
      const revisionData = allPendingChanges?.find((c: any) => c.id === banner.id);
      navigate(`/employee/banners/${revisionData?.bannerId || banner.id}/edit`, {
        state: {
          from: '/employee/banners',
          activeFilter,
          changeId: banner.id,
          isNeedsRevision: true,
          draftData: revisionData?.proposedPayload,
          reason: revisionData?.reason,
          bannerId: revisionData?.bannerId
        },
        replace: false
      });
    } else if (banner.status === 'pending') {
      navigate(`/employee/banners/${banner.id}`, {
        state: { 
          from: '/employee/banners',
          activeFilter,
          changeId: banner.id,
          isPending: true
        },
        replace: false
      });
    } else if (banner.bannerId) {
      navigate(`/employee/banners/${banner.bannerId}`, {
        state: { 
          from: '/employee/banners',
          activeFilter
        },
        replace: false
      });
    } else {
      navigate(`/employee/banners/${banner.id}`, {
        state: { 
          from: '/employee/banners',
          activeFilter
        },
        replace: false
      });
    }
  };

  const handleAddBanner = () => {
    navigate('/employee/banners/new/edit');
  };

  if (isLoading && !bannersData && !allPendingChanges) {
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
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banners</h1>
          <button
            disabled
            className="p-2 bg-primary text-primary-foreground rounded-lg opacity-50 cursor-not-allowed"
            aria-label="Add Banner"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="bg-background/95 backdrop-blur-sm sticky top-\[61px\] z-10 pb-3 border-b border-border/30">
          <div className="px-4 sm:px-6 pt-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search banners..."
                disabled
                value=""
                readOnly
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['all', 'active', 'inactive', 'pending', 'needs_revision', 'drafts'] as const).map((filter) => (
                <button
                  key={filter}
                  disabled
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap bg-muted text-muted-foreground opacity-50 cursor-not-allowed flex-shrink-0"
                >
                  {filter === 'all' ? 'All' : filter === 'needs_revision' ? 'Requested Changes' : filter === 'drafts' ? 'Drafts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 mt-3">
          {[...Array(5)].map((_, i) => (
            <BannerRowSkeleton key={i} />
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
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banners</h1>
          <button
            onClick={handleAddBanner}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors active:scale-95"
            aria-label="Add Banner"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="bg-background/95 backdrop-blur-sm sticky top-\[61px\] z-10 pb-3 border-b border-border/30">
          <div className="px-4 sm:px-6 pt-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search banners..."
                disabled
                value=""
                readOnly
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['all', 'active', 'inactive', 'pending', 'needs_revision', 'drafts'] as const).map((filter) => (
                <button
                  key={filter}
                  disabled
                  className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap bg-muted text-muted-foreground opacity-50 cursor-not-allowed flex-shrink-0"
                >
                  {filter === 'all' ? 'All' : filter === 'needs_revision' ? 'Requested Changes' : filter === 'drafts' ? 'Drafts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Failed to Load Banners</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Unable to fetch banners. Please check your connection and try again.</p>
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
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
        <button
          onClick={() => navigate('/employee/home')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banners</h1>
        <button
          onClick={handleAddBanner}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors active:scale-95"
          aria-label="Add Banner"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="bg-background/95 backdrop-blur-sm sticky top-\[61px\] z-10 pb-3 border-b border-border/30">
        <div className="px-4 sm:px-6 pt-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search banners..."
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
        <div className="px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'active', 'inactive', 'pending', 'needs_revision', 'drafts'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setSearchParams({ filter });
                }}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeFilter === filter
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'needs_revision' ? 'Requested Changes' : filter === 'drafts' ? 'Drafts' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 mt-3">
        {isLoading || !bannersData || !allPendingChanges ? (
          <>
            {[...Array(5)].map((_, i) => (
              <BannerRowSkeleton key={i} />
            ))}
          </>
        ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-1">
            {searchQuery 
              ? `No results for "${searchQuery}"`
              : activeFilter === 'all'
              ? 'No banners found'
              : activeFilter === 'drafts'
              ? 'No draft banners'
              : activeFilter === 'needs_revision'
              ? 'No banners with requested changes'
              : `No ${activeFilter} banners`
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
            {banners.map((banner) => (
              <BannerRow
                key={banner.id}
                banner={banner}
                onClick={() => handleBannerClick(banner)}
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
