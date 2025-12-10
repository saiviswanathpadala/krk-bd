import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCw,
  Image,
  CheckCircle2,
  Clock,
  Plus,
  ArrowLeft,
  Trash2,
  Loader2,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';

interface Banner {
  id: number | string;
  title: string;
  subtitle: string;
  imageUrl: string;
  targetRole: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  isPendingChange?: boolean;
  bannerStatus?: string;
  bannerId?: number;
}

const BannerRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm">
    <div className="flex items-center gap-2 sm:gap-3">
      <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-28 sm:w-32 mb-2 animate-pulse" />
        <Skeleton className="h-3 w-36 sm:w-48 mb-2 animate-pulse" />
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-16 rounded-full animate-pulse" />
          <Skeleton className="h-3 w-16 animate-pulse" />
        </div>
        <Skeleton className="h-3 w-20 animate-pulse" />
      </div>
      <Skeleton className="w-5 h-5 rounded flex-shrink-0 animate-pulse" />
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

  const borderClass = banner.bannerStatus === 'pending' 
    ? 'border-orange-500 border-2' 
    : banner.bannerStatus === 'needs_revision'
    ? 'border-yellow-500 border-2'
    : banner.bannerStatus === 'draft' 
    ? 'border-gray-500 border-2' 
    : 'border-border/50';

  return (
    <div className={`w-full bg-card rounded-xl border ${borderClass} p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onClick}
          className="flex-1 flex items-center gap-2 sm:gap-3 text-left"
        >
          {/* Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
            {banner.imageUrl ? (
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#EC4899]/20 flex items-center justify-center">
                <Image className="w-8 h-8 sm:w-10 sm:h-10 text-[#EC4899]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
              {banner.title || 'No Title'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
              {banner.subtitle || 'No Subtitle'}
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {banner.bannerStatus === 'pending' && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-600 text-xs font-medium rounded-full border border-orange-500/30">
                  Pending
                </span>
              )}
              {banner.bannerStatus === 'needs_revision' && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs font-medium rounded-full border border-yellow-500/30">
                  Needs Revision
                </span>
              )}
              {banner.bannerStatus === 'draft' && (
                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-600 text-xs font-medium rounded-full border border-gray-500/30">
                  Draft
                </span>
              )}
              {!banner.bannerStatus || banner.bannerStatus === 'approved' ? (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  banner.isActive 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground capitalize">
                {banner.targetRole || 'All'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(banner.createdAt)}
            </p>
          </div>

          {/* Meta */}
          <div className="text-right flex-shrink-0">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </button>
      </div>
    </div>
  );
};

export const AdminBannersListPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const searchParams = new URLSearchParams(location.search);
  const urlFilter = searchParams.get('filter') as 'all' | 'approved' | 'pending' | 'needs_revision' | null;
  const initialFilter = urlFilter || 'all';
  const [activeFilter, setActiveFilter] = useState<'all' | 'approved' | 'pending' | 'needs_revision'>(initialFilter);

  // Sync activeFilter with URL on mount and URL changes
  useEffect(() => {
    if (urlFilter && urlFilter !== activeFilter) {
      setActiveFilter(urlFilter);
    }
  }, [urlFilter]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('filter') !== activeFilter) {
      params.set('filter', activeFilter);
      navigate(`?${params.toString()}`, { replace: true });
    }
  }, [activeFilter, navigate, location.search]);

  // Use different queries based on filter
  const isPendingChangeFilter = activeFilter === 'pending' || activeFilter === 'needs_revision';
  
  const {
    data: bannersResponse,
    isLoading: isLoadingBanners,
    error: errorBanners,
    refetch: refetchBanners,
  } = useQuery({
    queryKey: ['admin-banners', 'approved', debouncedSearch],
    queryFn: async () => {
      const response = await adminAPI.getBanners(token!, {
        status: 'approved',
        q: debouncedSearch || undefined,
      });
      return response.data;
    },
    enabled: !!token && (activeFilter === 'all' || activeFilter === 'approved'),
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: pendingChangesResponse,
    isLoading: isLoadingPending,
    error: errorPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['admin-pending-changes', 'banner', activeFilter === 'all' ? 'all-statuses' : activeFilter, debouncedSearch],
    queryFn: async () => {
      if (activeFilter === 'all') {
        const pendingResponse = await adminAPI.getPendingChanges(token!, {
          type: 'banner',
          status: 'pending',
          limit: 100,
          q: debouncedSearch || undefined,
        });
        const needsRevisionResponse = await adminAPI.getPendingChanges(token!, {
          type: 'banner',
          status: 'needs_revision',
          limit: 100,
          q: debouncedSearch || undefined,
        });
        return {
          data: [...(pendingResponse.data.data || []), ...(needsRevisionResponse.data.data || [])],
        };
      }
      const response = await adminAPI.getPendingChanges(token!, {
        type: 'banner',
        status: activeFilter,
        limit: 100,
        q: debouncedSearch || undefined,
      });
      return response.data;
    },
    enabled: !!token && (isPendingChangeFilter || activeFilter === 'all'),
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Combine loading and error states
  const isLoading = isLoadingBanners || isLoadingPending;
  const error = errorBanners || errorPending;
  const refetch = () => {
    if (isPendingChangeFilter) {
      refetchPending();
    } else {
      refetchBanners();
    }
    if (activeFilter === 'all') {
      refetchBanners();
      refetchPending();
    }
  };

  // Transform data based on filter
  const banners: Banner[] = useMemo(() => {
    if (isPendingChangeFilter) {
      // Transform pending changes to banner-like objects
      return (pendingChangesResponse?.data || []).map((change: any) => ({
        id: change.id, // This is the pending change ID (UUID)
        imageUrl: change.proposedPayload?.imageUrl || change.targetThumbnail || '',
        title: change.proposedPayload?.title || change.targetTitle || 'Banner',
        subtitle: change.proposedPayload?.subtitle || '',
        targetRole: change.proposedPayload?.targetRole || 'All',
        isActive: change.proposedPayload?.isActive || false,
        displayOrder: change.proposedPayload?.displayOrder || 0,
        createdAt: change.createdAt,
        status: change.status,
        isPendingChange: true,
        bannerStatus: change.status,
        bannerId: change.targetId || change.bannerId,
      }));
    } else if (activeFilter === 'all') {
      // Combine approved banners with pending changes
      const approved = (bannersResponse?.data || []).map((banner: any) => ({
        ...banner,
        isPendingChange: false,
        bannerStatus: 'approved',
      }));
      
      const pending = (pendingChangesResponse?.data || []).map((change: any) => ({
        id: change.id,
        imageUrl: change.proposedPayload?.imageUrl || change.targetThumbnail || '',
        title: change.proposedPayload?.title || change.targetTitle || 'Banner',
        subtitle: change.proposedPayload?.subtitle || '',
        targetRole: change.proposedPayload?.targetRole || 'All',
        isActive: change.proposedPayload?.isActive || false,
        displayOrder: change.proposedPayload?.displayOrder || 0,
        createdAt: change.createdAt,
        status: change.status,
        isPendingChange: true,
        bannerStatus: change.status,
        bannerId: change.targetId || change.bannerId,
      }));
      
      return [...pending, ...approved];
    } else {
      // Regular approved banners
      return (bannersResponse?.data || []).map((banner: any) => ({
        ...banner,
        isPendingChange: false,
        bannerStatus: 'approved',
      }));
    }
  }, [bannersResponse, pendingChangesResponse, activeFilter, isPendingChangeFilter]);



  const handleBannerClick = (banner: Banner) => {
    if (banner.status === 'draft' || banner.bannerStatus === 'draft') {
      const draftData = (pendingChangesResponse?.data || []).find((change: any) => change.id === banner.id);
      navigate(`/admin/banners/${banner.id}`, {
        state: {
          isDraft: true,
          changeId: banner.id,
          draftData: draftData?.proposedPayload,
          bannerId: banner.bannerId,
          returnFilter: activeFilter,
        },
      });
    } else if (banner.isPendingChange || banner.status === 'pending' || banner.bannerStatus === 'pending' || banner.status === 'needs_revision' || banner.bannerStatus === 'needs_revision') {
      navigate(`/admin/pending-changes/${banner.id}`, {
        state: { returnFilter: activeFilter },
      });
    } else {
      navigate(`/admin/banners/${banner.id}`, {
        state: { returnFilter: activeFilter },
      });
    }
  };



  return (
    <div className="min-h-screen pb-8">
      {/* Header - Static */}
      <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => navigate('/admin/banners')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banners</h1>
        <Link
          to="/admin/banners/new/edit"
          className="p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Add Banner"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </Link>
      </header>

      {/* Search & Filters - Sticky */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[60px] z-10 pb-3 border-b border-border/30">
        {/* Search */}
        <div className="px-4 sm:px-6 pt-3">
          <div className="relative mb-3">
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

        {/* Filter Chips */}
        <div className="px-4 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { value: 'all', label: 'All' },
            { value: 'approved', label: 'Approved' },
            { value: 'pending', label: 'Pending Review' },
            { value: 'needs_revision', label: 'Needs Revision' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value as any)}
              disabled={isLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all disabled:opacity-50 flex-shrink-0 ${
                activeFilter === filter.value
                  ? 'bg-black text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      </div>

      {/* Banners List */}
      <div className="px-4 sm:px-6 mt-3">
        {isLoading ? (
          <div className="pt-2">
            {[...Array(5)].map((_, i) => (
              <BannerRowSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center px-4 py-12 sm:py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                {((error as any)?.code === 'ECONNREFUSED' || (error as any)?.message?.includes('Network Error')) 
                  ? 'Backend Server Not Running' 
                  : 'Failed to Load Banners'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                {((error as any)?.code === 'ECONNREFUSED' || (error as any)?.message?.includes('Network Error'))
                  ? 'Please make sure the backend server is running on port 3000.'
                  : 'Unable to fetch banners. Please try again.'}
              </p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mx-auto shadow-md hover:shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm sm:text-base font-semibold">Try Again</span>
              </button>
            </div>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No {activeFilter === 'all' ? '' : activeFilter.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} banners found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <BannerRow
                key={banner.id}
                banner={banner}
                onClick={() => handleBannerClick(banner)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
