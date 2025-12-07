import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Building2,
  X,
  MapPin,
  DollarSign,
  Plus,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { EMPLOYEE_PROPERTY_PENDING_CHANGES_LIST_KEY } from '@/constants/queryKeys';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number | string | null;
  images?: string[];
  createdAt: string;
  status?: string;
  isPendingNew?: boolean;
  isNeedsRevision?: boolean;
  propertyStatus?: string;
  propertyId?: string;
  isDraft?: boolean;
  hasPendingChange?: boolean;
}

const PropertyRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm animate-pulse">
    <div className="flex items-center gap-2 sm:gap-3">
      <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-28 sm:w-32 mb-2" />
        <Skeleton className="h-3 w-36 sm:w-48 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
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
    if (!price) return null;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return null;
    if (numPrice >= 10000000) return `₹${(numPrice / 10000000).toFixed(1)}Cr`;
    if (numPrice >= 100000) return `₹${(numPrice / 100000).toFixed(1)}L`;
    return `₹${numPrice.toLocaleString()}`;
  };

  const firstImage = property.images && property.images.length > 0 ? property.images[0] : null;
  const statusBadge = property.isPendingNew 
    ? { label: 'Pending Approval', color: 'bg-orange-500' }
    : property.isNeedsRevision
    ? { label: 'Requested Changes', color: 'bg-yellow-500' }
    : property.isDraft
    ? { label: 'Draft', color: 'bg-gray-500' }
    : property.propertyStatus === 'pending'
    ? { label: 'Pending', color: 'bg-orange-500' }
    : null;

  const borderClass = property.isPendingNew 
    ? 'border-orange-500 border-2' 
    : property.isNeedsRevision
    ? 'border-yellow-500 border-2'
    : property.isDraft 
    ? 'border-gray-500 border-2' 
    : 'border-border/50';

  return (
    <div className={`w-full bg-card rounded-xl border ${borderClass} p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all`}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 text-left"
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
              <Building2 className="w-10 h-10 text-[#10B981]" />
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
          {formatPrice(property.price) && (
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-[#10B981] mb-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formatPrice(property.price)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDate(property.createdAt)}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export const EmployeePropertiesPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'approved' | 'pending' | 'needs_revision' | 'drafts'>(
    (location.state as any)?.activeFilter || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (location.pathname === '/employee/properties') {
      queryClient.refetchQueries({ queryKey: ['employee-properties'], exact: false });
      queryClient.refetchQueries({ queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_LIST_KEY, exact: false });
    }
    // Set active filter from navigation state if provided
    if ((location.state as any)?.activeFilter) {
      setActiveFilter((location.state as any).activeFilter);
    }
  }, [location.pathname, location.state, queryClient]);

  const {
    data: propertiesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['employee-properties', debouncedSearch],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await employeeAPI.getProperties(token!, {
          cursor: pageParam || undefined,
          limit: 20,
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
        console.error('Error fetching properties:', error);
        return { data: [], nextCursor: null };
      }
    },
    getNextPageParam: (lastPage) => {
      try {
        if (!lastPage || typeof lastPage !== 'object') {
          return undefined;
        }

        const pageData = Array.isArray(lastPage?.data) ? lastPage.data : [];
        if (pageData.length === 0) {
          return undefined;
        }

        const nextCursor = lastPage?.nextCursor;
        if (!nextCursor) {
          return undefined;
        }

        return nextCursor;
      } catch (error) {
        console.error('Error in getNextPageParam (properties):', error, lastPage);
        return undefined;
      }
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

  const { data: pendingChangesData } = useInfiniteQuery({
    queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_LIST_KEY,
    queryFn: async ({ pageParam }) => {
      try {
        const response = await employeeAPI.getPendingChanges(token!, {
          cursor: pageParam || undefined,
          limit: 100,
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
        console.error('Error fetching pending changes:', error);
        return { data: [], nextCursor: null };
      }
    },
    getNextPageParam: (lastPage) => {
      try {
        if (!lastPage || typeof lastPage !== 'object') {
          return undefined;
        }

        const pageData = Array.isArray(lastPage?.data) ? lastPage.data : [];
        if (pageData.length === 0) {
          return undefined;
        }

        const nextCursor = lastPage?.nextCursor;
        if (!nextCursor) {
          return undefined;
        }

        return nextCursor;
      } catch (error) {
        console.error('Error in getNextPageParam (pending):', error, lastPage);
        return undefined;
      }
    },
    initialPageParam: null as string | null,
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const allProperties = useMemo(() => {
    if (!propertiesData?.pages) {
      return [];
    }
    const flattened = propertiesData.pages.flatMap(page => {
      if (!page || !page.data || !Array.isArray(page.data)) {
        return [];
      }
      return page.data;
    });
    return flattened;
  }, [propertiesData]);
  
  const pendingChanges = useMemo(() => {
    if (!pendingChangesData?.pages) {
      return [];
    }
    const flattened = pendingChangesData.pages.flatMap(page => {
      if (!page || !page.data || !Array.isArray(page.data)) {
        return [];
      }
      return page.data;
    });
    return flattened;
  }, [pendingChangesData]);

  const properties = useMemo(() => {
    const pendingChangesMap = new Map(
      pendingChanges.filter(c => c.propertyId && !c.isDraft && c.status === 'pending').map(change => [change.propertyId, change])
    );
    
    const newPropertyRequests = pendingChanges
      .filter(c => !c.propertyId && c.status === 'pending' && !c.isDraft)
      .map(change => ({
        id: change.id,
        title: change.proposedPayload?.title || 'New Property',
        location: change.proposedPayload?.location || '',
        price: change.proposedPayload?.price,
        images: change.proposedPayload?.images || [],
        type: change.proposedPayload?.type || 'New Listing',
        propertyStatus: 'pending',
        createdAt: change.createdAt,
        isPendingNew: true,
      }));
    
    const pendingEditProperties = pendingChanges
      .filter(c => c.propertyId && c.status === 'pending' && !c.isDraft)
      .map(change => ({
        id: change.id,
        propertyId: change.propertyId,
        title: change.proposedPayload?.title || 'Property',
        location: change.proposedPayload?.location || '',
        price: change.proposedPayload?.price,
        images: change.proposedPayload?.images || [],
        type: 'Pending Approval',
        propertyStatus: 'pending',
        createdAt: change.createdAt,
        isPendingNew: true,
      }));
    
    const needsRevisionProperties = pendingChanges
      .filter(c => c.status === 'needs_revision')
      .map(change => ({
        id: change.id,
        propertyId: change.propertyId,
        title: change.proposedPayload?.title || 'Property',
        location: change.proposedPayload?.location || '',
        price: change.proposedPayload?.price,
        images: change.proposedPayload?.images || [],
        type: 'Requested Changes',
        propertyStatus: 'needs_revision',
        createdAt: change.createdAt,
        isNeedsRevision: true,
        reason: change.reason,
      }));
    
    const processedProperties = allProperties.map(prop => ({
      ...prop,
      propertyStatus: 'approved',
      hasPendingChange: pendingChangesMap.has(prop.id),
    }));

    let filtered = [...newPropertyRequests, ...pendingEditProperties, ...needsRevisionProperties, ...processedProperties];

    if (activeFilter === 'all') {
      // Show all except drafts
      filtered = filtered.filter(p => !p.isDraft);
    } else if (activeFilter === 'pending') {
      filtered = filtered.filter(p => p.propertyStatus === 'pending' || p.isPendingNew);
    } else if (activeFilter === 'needs_revision') {
      filtered = filtered.filter(p => p.isNeedsRevision);
    } else if (activeFilter === 'approved') {
      filtered = filtered.filter(p => p.propertyStatus === 'approved' && !p.isPendingNew && !p.isNeedsRevision);
    } else if (activeFilter === 'drafts') {
      const draftChanges = pendingChanges
        .filter(c => c.isDraft)
        .map(change => ({
          id: change.id,
          propertyId: change.propertyId,
          title: change.proposedPayload?.title || 'Draft Property',
          location: change.proposedPayload?.location || '',
          price: change.proposedPayload?.price,
          images: change.proposedPayload?.images || [],
          type: 'Draft',
          propertyStatus: 'draft',
          createdAt: change.createdAt,
          isDraft: true,
        }));
      filtered = draftChanges;
    }

    return filtered;
  }, [allProperties, pendingChanges, activeFilter]);

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

  const handlePropertyClick = (property: Property & { propertyId?: string; isDraft?: boolean }) => {
    if (property.isPendingNew && property.propertyId) {
      // Pending edit - navigate to the actual property with pending change info
      navigate(`/employee/properties/${property.propertyId}`, { 
        state: { 
          changeId: property.id,
          isPendingEdit: true,
          returnTo: '/employee/properties',
          returnFilter: activeFilter
        },
        replace: false
      });
    } else if (property.isPendingNew) {
      // New property pending approval
      navigate(`/employee/properties/${property.id}`, { 
        state: { 
          changeId: property.id, 
          isPendingNew: true,
          returnTo: '/employee/properties',
          returnFilter: activeFilter
        },
        replace: false
      });
    } else if (property.isNeedsRevision) {
      navigate(`/employee/properties/${property.propertyId || property.id}`, { 
        state: { 
          changeId: property.id, 
          isNeedsRevision: true,
          reason: property.reason,
          returnTo: '/employee/properties',
          returnFilter: activeFilter
        },
        replace: false
      });
    } else if (property.isDraft) {
      const draftData = pendingChanges.find((c: any) => c.id === property.id && c.isDraft);
      // Cache the draft data for instant access
      queryClient.setQueryData(['employee-property', property.id], {
        data: {
          data: {
            id: property.id,
            ...draftData?.proposedPayload,
            createdAt: property.createdAt
          }
        }
      });
      
      navigate(`/employee/properties/${property.id}/edit`, { 
        state: { 
          changeId: property.id, 
          isDraft: true,
          initialDraftData: draftData?.proposedPayload,
          returnTo: '/employee/properties',
          returnFilter: activeFilter,
          skipLoading: true
        },
        replace: false
      });
    } else {
      // Regular property - pass hasPendingChange flag
      navigate(`/employee/properties/${property.id}`, { 
        state: { 
          from: '/employee/properties',
          returnTo: '/employee/properties',
          returnFilter: activeFilter,
          hasPendingChange: property.hasPendingChange
        },
        replace: false
      });
    }
  };

  const handleAddProperty = () => {
    navigate('/employee/properties/new/edit', {
      state: {
        returnTo: '/employee/properties',
        returnFilter: activeFilter
      }
    });
  };

  if (isLoading && !propertiesData && !pendingChangesData) {
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
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Properties</h1>
          <button
            disabled
            className="p-2 bg-primary text-primary-foreground rounded-lg opacity-50 cursor-not-allowed"
            aria-label="Add Property"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
          <div className="px-4 sm:px-6 pt-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search properties..."
                disabled
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['all', 'approved', 'pending', 'needs_revision', 'drafts'] as const).map((filter) => (
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
            <PropertyRowSkeleton key={i} />
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
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Properties</h1>
          <button
            onClick={handleAddProperty}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors active:scale-95"
            aria-label="Add Property"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
          <div className="px-4 sm:px-6 pt-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search properties..."
                disabled
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['all', 'approved', 'pending', 'needs_revision', 'drafts'] as const).map((filter) => (
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
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Failed to Load Properties</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Unable to fetch properties. Please check your connection and try again.</p>
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
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Properties</h1>
        <button
          onClick={handleAddProperty}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors active:scale-95"
          aria-label="Add Property"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="bg-background/95 backdrop-blur-sm sticky top-[57px] z-10 pb-3 border-b border-border/30">
        <div className="px-4 sm:px-6 pt-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search properties..."
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
            {(['all', 'approved', 'pending', 'needs_revision', 'drafts'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
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
        {isLoading || !propertiesData || !pendingChangesData ? (
          <>
            {[...Array(5)].map((_, i) => (
              <PropertyRowSkeleton key={i} />
            ))}
          </>
        ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-1">
            {searchQuery 
              ? `No results for "${searchQuery}"`
              : activeFilter === 'all'
              ? 'No properties found'
              : activeFilter === 'drafts'
              ? 'No draft properties'
              : activeFilter === 'needs_revision'
              ? 'No properties with requested changes'
              : `No ${activeFilter} properties`
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
            {properties.map((property) => (
              <PropertyRow
                key={property.id}
                property={property}
                onClick={() => handlePropertyClick(property)}
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
