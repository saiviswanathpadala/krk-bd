import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Building2, AlertCircle, RefreshCw, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { bannerAPI, propertyAPI } from '@/utils/api';
import { BannerCarousel, PropertyCard } from '@/components/customer';
import { Skeleton } from '@/components/ui/skeleton';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price?: string | number | null;
  images?: string[];
  gallery?: string[];
  description?: string | null;
  features?: string[];
  amenities?: string[];
  categories?: string[];
  brochureUrl?: string | null;
  map?: string | null;
  website?: string | null;
  type?: string;
}

// Skeleton Components matching mobile version
const BannerSkeleton = () => (
  <div className="mb-8">
    <Skeleton className="w-full h-[280px] sm:h-[350px] md:h-[420px] rounded-2xl" />
    <div className="flex justify-center items-center mt-3 gap-1.5">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="w-2 h-2 rounded-full" />
      ))}
    </div>
  </div>
);

const PropertyCardSkeleton = () => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg">
    <Skeleton className="h-48 sm:h-56 rounded-none" />
    <div className="p-4 sm:p-5 space-y-3">
      <Skeleton className="h-6 w-4/5" />
      <div className="flex items-center gap-1">
        <Skeleton className="w-3.5 h-3.5 rounded-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-full rounded-xl mt-3" />
    </div>
  </div>
);

export const HomePage: React.FC = () => {
  const { token, user } = useAuthStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [cachedProperties, setCachedProperties] = useState<Property[]>([]);
  const [showCached, setShowCached] = useState(true);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  // Load cached properties on mount
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = localStorage.getItem('cached_properties');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setCachedProperties(data || []);
          }
        }
      } catch (error) {
        console.log('Failed to load cached properties:', error);
      } finally {
        setCacheLoaded(true);
      }
    };
    loadCache();
  }, []);

  // Fetch banners with cache
  const {
    data: bannersData,
    isLoading: bannersLoading,
    error: bannersError,
    refetch: refetchBanners,
  } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const response = await bannerAPI.getBanners(token!);
      return response.data.data as Banner[];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  // Fetch properties with infinite scroll and cache
  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    error: propertiesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProperties,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['properties'],
    queryFn: async ({ pageParam }) => {
      const response = await propertyAPI.getProperties(token!, pageParam || undefined, 10);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
    enabled: !!token && cacheLoaded,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  // Cache properties when data loads
  useEffect(() => {
    if (propertiesData && propertiesData.pages.length > 0) {
      setShowCached(false);
      const firstPageData = propertiesData.pages[0]?.data || [];
      if (firstPageData.length > 0) {
        try {
          localStorage.setItem('cached_properties', JSON.stringify({ data: firstPageData, timestamp: Date.now() }));
        } catch (error) {
          console.log('Failed to cache properties:', error);
        }
      }
    }
  }, [propertiesData]);

  // Flatten properties from all pages
  const properties: Property[] = propertiesData?.pages.flatMap((page) => page.data) || [];
  const displayProperties = showCached && properties.length === 0 ? cachedProperties : properties;
  const banners = bannersData || [];

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

  const handleRetry = () => {
    refetchBanners();
    refetchProperties();
  };

  // Loading state with skeleton matching actual UI
  if (!cacheLoaded || (propertiesLoading && cachedProperties.length === 0)) {
    return (
      <div className="min-h-screen pb-8">
        {/* Welcome Section Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Banner Skeleton */}
        <BannerSkeleton />

        {/* Properties Section Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state with proper handling
  if (propertiesError && cachedProperties.length === 0) {
    const errorMessage = (propertiesError as any)?.response?.status === 401
      ? 'Session expired. Please login again.'
      : (propertiesError as any)?.message?.includes('Network')
      ? 'No internet connection. Please check your network.'
      : 'Unable to fetch properties. Please try again.';

    return (
      <div className="min-h-screen pb-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="mb-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              Welcome, {user?.name || 'User'}
              <span className="text-2xl sm:text-3xl">👋</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {user?.role && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span className="capitalize">{user.role}</span>
              </div>
            )}
            {user?.city && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{user.city}</span>
                </div>
              </>
            )}
          </div>
        </motion.section>

        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Failed to Load Properties
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">{errorMessage}</p>
          <button
            onClick={handleRetry}
            disabled={isRefetching}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-md transition-all duration-200 ease-out hover:bg-primary/85 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRefetching ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Welcome Section - Matching Mobile Design */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
   
        </div>
        
        <div className="mb-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
            Welcome, {user?.name || 'User'}
            <span className="text-2xl sm:text-3xl">👋</span>
          </h2>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {user?.role && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span className="capitalize">{user.role}</span>
            </div>
          )}
          {user?.city && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{user.city}</span>
              </div>
            </>
          )}
        </div>
      </motion.section>

      {/* Banner Carousel Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        {bannersLoading ? (
          <BannerSkeleton />
        ) : bannersError ? (
          <div className="w-full h-[280px] sm:h-[350px] md:h-[420px] rounded-2xl bg-destructive/10 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-destructive font-medium">Failed to load banners</p>
            <button
              onClick={() => refetchBanners()}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg shadow-md transition-all duration-200 ease-out hover:bg-destructive/85 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : (
          <BannerCarousel banners={banners} autoPlay interval={5000} />
        )}
      </motion.section>

      {/* Properties Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Properties</h2>
              <p className="text-sm text-muted-foreground">
                Discover your dream property
              </p>
            </div>
          </div>
          {!propertiesLoading && properties.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Showing {properties.length} properties
            </span>
          )}
        </div>

        {propertiesError ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Failed to load properties
            </h3>
            <p className="text-muted-foreground text-center mb-4">Something went wrong</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md transition-all duration-200 ease-out hover:bg-primary/85 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No properties available
            </h3>
            <p className="text-muted-foreground text-center">
              Check back later for new listings
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProperties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                />
              ))}
            </div>

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="mt-8">
              {isFetchingNextPage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              )}
              {!hasNextPage && displayProperties.length > 0 && (
                <p className="text-muted-foreground text-sm text-center">
                  You've reached the end of the list
                </p>
              )}
            </div>
          </>
        )}
      </motion.section>
    </div>
  );
};

