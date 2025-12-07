import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Building2,
  X,
  MapPin,
  DollarSign,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminListHeader } from '@/components/admin/AdminListHeader';
import { useQueryClient } from '@tanstack/react-query';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number | string | null;
  images?: string[];
  createdAt: string;
  status?: string;
  isPendingChange?: boolean;
  propertyStatus?: string;
  propertyId?: string | number;
}

const PropertyRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm animate-pulse flex items-center gap-2 sm:gap-3">
    <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-48 mb-2" />
      <Skeleton className="h-4 w-24 mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </div>
);

const PropertyRow: React.FC<{ 
  property: Property; 
  onClick: () => void;
}> = ({ property, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price: number | string | null) => {
    if (!price) return 'Price on request';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Price on request';
    if (numPrice >= 10000000) return `₹${(numPrice / 10000000).toFixed(1)}Cr`;
    if (numPrice >= 100000) return `₹${(numPrice / 100000).toFixed(1)}L`;
    return `₹${numPrice.toLocaleString()}`;
  };

  const firstImage = property.images && property.images.length > 0 ? property.images[0] : null;

  const borderClass = property.propertyStatus === 'pending' 
    ? 'border-orange-500 border-2' 
    : property.propertyStatus === 'needs_revision'
    ? 'border-yellow-500 border-2'
    : property.propertyStatus === 'draft' 
    ? 'border-gray-500 border-2' 
    : 'border-border/50';

  return (
    <button
      onClick={onClick}
      className={`w-full bg-card rounded-xl border ${borderClass} p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all flex items-center gap-2 sm:gap-3 text-left`}
    >
          {/* Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
            {firstImage ? (
              <img
                src={firstImage}
                alt={property.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#10B981]/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#10B981]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
              {property.title || 'No Title'}
            </h3>
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground mb-1">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{property.location || 'No Location'}</span>
            </div>
            {formatPrice(property.price) && formatPrice(property.price) !== 'Price on request' && (
              <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-[#10B981] mb-2">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatPrice(property.price)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {property.propertyStatus === 'pending' && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-600 text-xs font-medium rounded-full border border-orange-500/30">
                  Pending
                </span>
              )}
              {property.propertyStatus === 'needs_revision' && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs font-medium rounded-full border border-yellow-500/30">
                  Needs Revision
                </span>
              )}
              {property.propertyStatus === 'draft' && (
                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-600 text-xs font-medium rounded-full border border-gray-500/30">
                  Draft
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(property.createdAt)}
              </span>
            </div>
          </div>
        </button>
  );
};

export const AdminPropertiesListPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const searchParams = new URLSearchParams(location.search);
  const initialFilter = (searchParams.get('filter') as any) || (location.state as any)?.activeFilter || 'all';
  const [activeFilter, setActiveFilter] = useState<'all' | 'approved' | 'pending' | 'needs_revision' | 'draft'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');


  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use different queries based on filter
  const isPendingChangeFilter = activeFilter === 'pending' || activeFilter === 'needs_revision' || activeFilter === 'draft';
  
  const {
    data: propertiesData,
    isLoading: isLoadingProperties,
    error: errorProperties,
    fetchNextPage: fetchNextProperties,
    hasNextPage: hasNextProperties,
    isFetchingNextPage: isFetchingNextProperties,
    refetch: refetchProperties,
  } = useInfiniteQuery({
    queryKey: ['admin-properties', 'approved', debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const response = await adminAPI.getProperties(token!, {
        status: 'approved',
        limit: 20,
        cursor: pageParam || undefined,
        q: debouncedSearch || undefined,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: null as string | null,
    enabled: !!token && (activeFilter === 'all' || activeFilter === 'approved'),
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: pendingChangesData,
    isLoading: isLoadingPending,
    error: errorPending,
    fetchNextPage: fetchNextPending,
    hasNextPage: hasNextPending,
    isFetchingNextPage: isFetchingNextPending,
    refetch: refetchPending,
  } = useInfiniteQuery({
    queryKey: ['admin-pending-changes', 'property', activeFilter === 'all' ? 'all-statuses' : activeFilter, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      if (activeFilter === 'all') {
        const pendingResponse = await adminAPI.getPendingChanges(token!, {
          type: 'property',
          status: 'pending',
          limit: 20,
          cursor: pageParam || undefined,
          q: debouncedSearch || undefined,
        });
        const needsRevisionResponse = await adminAPI.getPendingChanges(token!, {
          type: 'property',
          status: 'needs_revision',
          limit: 20,
          cursor: undefined,
          q: debouncedSearch || undefined,
        });
        return {
          data: [...(pendingResponse.data.data || []), ...(needsRevisionResponse.data.data || [])],
          nextCursor: pendingResponse.data.nextCursor || needsRevisionResponse.data.nextCursor || null,
        };
      }
      const response = await adminAPI.getPendingChanges(token!, {
        type: 'property',
        status: activeFilter,
        limit: 20,
        cursor: pageParam || undefined,
        q: debouncedSearch || undefined,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: null as string | null,
    enabled: !!token && (isPendingChangeFilter || activeFilter === 'all'),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Combine loading and error states
  const isLoading = isLoadingProperties || isLoadingPending;
  const error = errorProperties || errorPending;
  const refetch = () => {
    if (activeFilter === 'all') {
      refetchProperties();
      refetchPending();
    } else if (isPendingChangeFilter) {
      refetchPending();
    } else {
      refetchProperties();
    }
  };

  // Transform data based on filter
  const properties: Property[] = useMemo(() => {
    if (isPendingChangeFilter) {
      // Transform pending changes to property-like objects
      return pendingChangesData?.pages.flatMap((page) => 
        (page.data || []).map((change: any) => ({
          id: change.id, // This is the pending change ID (UUID)
          title: change.proposedPayload?.title || change.targetTitle || 'Property',
          location: change.proposedPayload?.location || '',
          price: change.proposedPayload?.price || null,
          images: change.proposedPayload?.images || (change.targetThumbnail ? [change.targetThumbnail] : []),
          createdAt: change.createdAt,
          status: change.status,
          isPendingChange: true,
          propertyStatus: change.status,
          propertyId: change.targetId || change.propertyId,
        }))
      ) || [];
    } else if (activeFilter === 'all') {
      // Combine approved properties with pending changes (excluding drafts)
      const approved = propertiesData?.pages.flatMap((page) => 
        (page.data || []).map((prop: any) => ({
          ...prop,
          isPendingChange: false,
          propertyStatus: prop.status || 'approved',
        }))
      ) || [];
      
      const pending = pendingChangesData?.pages.flatMap((page) => 
        (page.data || []).map((change: any) => ({
          id: change.id,
          title: change.proposedPayload?.title || change.targetTitle || 'Property',
          location: change.proposedPayload?.location || '',
          price: change.proposedPayload?.price || null,
          images: change.proposedPayload?.images || (change.targetThumbnail ? [change.targetThumbnail] : []),
          createdAt: change.createdAt,
          status: change.status,
          isPendingChange: true,
          propertyStatus: change.status,
          propertyId: change.targetId || change.propertyId,
        }))
      ) || [];
      
      return [...pending, ...approved];
    } else {
      // Regular approved properties
      return propertiesData?.pages.flatMap((page) => 
        (page.data || []).map((prop: any) => ({
          ...prop,
          isPendingChange: false,
          propertyStatus: prop.status || 'approved',
        }))
      ) || [];
    }
  }, [propertiesData, pendingChangesData, activeFilter, isPendingChangeFilter]);

  // Use appropriate fetch functions
  const fetchNextPage = useCallback(() => {
    if (activeFilter === 'all') {
      if (hasNextProperties) fetchNextProperties();
      if (hasNextPending) fetchNextPending();
    } else if (isPendingChangeFilter) {
      fetchNextPending();
    } else {
      fetchNextProperties();
    }
  }, [activeFilter, isPendingChangeFilter, hasNextProperties, hasNextPending, fetchNextProperties, fetchNextPending]);
  
  const hasNextPage = activeFilter === 'all' 
    ? (hasNextProperties || hasNextPending)
    : (isPendingChangeFilter ? hasNextPending : hasNextProperties);
  const isFetchingNextPage = isFetchingNextPending || isFetchingNextProperties;

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



  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('filter', activeFilter);
    navigate(`?${params.toString()}`, { replace: true });
  }, [activeFilter]);

  const handlePropertyClick = (property: Property) => {
    // If it's a draft, navigate to edit page with draft data
    if (property.status === 'draft' || property.propertyStatus === 'draft') {
      // Find the draft data from pending changes
      const draftData = pendingChangesData?.pages.flatMap((page) => 
        (page.data || []).find((change: any) => change.id === property.id)
      ).find(Boolean);
      
      // Cache the draft data for instant access
      queryClient.setQueryData(['admin-property', property.id], {
        data: {
          data: {
            id: property.id,
            ...draftData?.proposedPayload,
            createdAt: property.createdAt
          }
        }
      });
      
      navigate(`/admin/properties/${property.id}/edit`, {
        state: {
          isDraft: true,
          changeId: property.id,
          initialDraftData: draftData?.proposedPayload,
          propertyId: property.propertyId,
          skipLoading: true,
          returnFilter: activeFilter,
        },
      });
    } else if (property.isPendingChange || property.status === 'pending' || property.propertyStatus === 'pending') {
      // If it's a pending change (not draft), navigate to pending change detail page
      navigate(`/admin/pending-changes/${property.id}`, {
        state: { returnFilter: activeFilter },
      });
    } else {
      // Regular property, navigate to property detail page
      navigate(`/admin/properties/${property.id}`, {
        state: { returnFilter: activeFilter },
      });
    }
  };



  return (
    <div className="min-h-screen pb-8 relative">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-30 mb-3">
        <button
          onClick={() => navigate('/admin/properties')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Properties</h1>
        <Link
          to="/admin/properties/new/edit"
          className="p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
          title="Add Property"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </Link>
      </div>

      {/* Filter Chips */}
      <div className="px-4 sm:px-6 pt-4 pb-2 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { value: 'all', label: 'All' },
            { value: 'approved', label: 'Approved' },
            { value: 'pending', label: 'Pending Review' },
            { value: 'needs_revision', label: 'Needs Revision' },
            { value: 'draft', label: 'Draft' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value as any)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
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

      {/* Search */}
      <div className="px-4 sm:px-6 pt-3 pb-3 relative z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Properties List */}
      <div className="px-4 sm:px-6">
        {isLoading ? (
          <div className="pt-2">
            {[...Array(5)].map((_, i) => (
              <PropertyRowSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center px-4 py-12 sm:py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Failed to Load Properties</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                Unable to fetch properties. Please try again.
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
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              No {activeFilter === 'all' ? '' : activeFilter.replace('_', ' ')} properties found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <PropertyRow
                key={property.id}
                property={property}
                onClick={() => handlePropertyClick(property)}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={loadMoreRef} className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

