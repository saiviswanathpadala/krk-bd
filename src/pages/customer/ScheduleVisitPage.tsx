import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Building2, Loader2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { propertyAPI } from '@/utils/api';

// Calendly URL - Matching mobile implementation
const CALENDLY_BASE_URL = 'https://calendly.com/viswanath-sakethaiautomation/property-visit';

interface Property {
  id: string;
  title: string;
  location: string;
  price?: string | number | null;
}

export const ScheduleVisitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuthStore();
  
  const [calendlyLoading, setCalendlyLoading] = useState(true);
  const [hasCalendlyLoaded, setHasCalendlyLoaded] = useState(false);

  // Get property from location state or fetch it
  const propertyFromState = location.state?.property as Property | undefined;

  // Fetch property if not in state
  const {
    data: property,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await propertyAPI.getPropertyById(token!, id!);
      return response.data as Property;
    },
    enabled: !!token && !!id && !propertyFromState,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  const displayProperty = propertyFromState || property;

  // Build Calendly URL with same parameters as mobile
  const buildCalendlyUrl = () => {
    if (!displayProperty) return '';
    
    const params = new URLSearchParams({
      embed_domain: window.location.hostname,
      embed_type: 'Inline',
      hide_event_type_details: '1',
      hide_gdpr_banner: '1',
      location: displayProperty.location || '',
    });

    if (user?.name) params.append('name', user.name);
    if (user?.email) params.append('email', user.email);
    if (user?.phone) {
      const phoneWithCountryCode = user.phone.startsWith('+') ? user.phone : `+91${user.phone}`;
      params.append('a1', phoneWithCountryCode);
    }

    return `${CALENDLY_BASE_URL}?${params.toString()}`;
  };

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return 'Price on Request';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Price on Request';
    
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(2)} L`;
    } else {
      return `₹${numPrice.toLocaleString('en-IN')}`;
    }
  };

  if (isLoading && !propertyFromState) {
    return (
      <div className="min-h-screen pb-8">
        {/* Header Skeleton - matching employee pages */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-7 w-48 sm:w-64" />
          <div className="w-9 sm:w-10" />
        </div>

        <div className="px-4 sm:px-6">
          {/* Calendly Section Skeleton - matching actual UI */}
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Property Summary Skeleton */}
            <div className="p-3 sm:p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 sm:h-5 w-3/4" />
                  <Skeleton className="h-3 sm:h-4 w-1/2" />
                </div>
              </div>
            </div>

            {/* Calendly Header Skeleton */}
            <div className="p-3 sm:p-4 md:p-6 border-b border-border">
              <Skeleton className="h-5 sm:h-6 w-40 sm:w-48 mb-1 sm:mb-2" />
              <Skeleton className="h-3 sm:h-4 w-full max-w-xs sm:max-w-md" />
            </div>

            {/* Calendly Calendar Skeleton */}
            <div className="p-3 sm:p-4 md:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Month navigation */}
                <div className="flex items-center justify-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>

                {/* Calendar grid */}
                <div className="space-y-3">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-2">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-8 rounded-lg" />
                    ))}
                  </div>
                  {/* Date buttons - 5 rows */}
                  {[...Array(5)].map((_, row) => (
                    <div key={row} className="grid grid-cols-7 gap-2">
                      {[...Array(7)].map((_, col) => (
                        <Skeleton key={col} className="h-10 sm:h-12 rounded-full" />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Timezone */}
                <div className="pt-4 border-t border-border">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !displayProperty) {
    const errorMessage = error
      ? 'Unable to load property details. Please check your connection and try again.'
      : 'Property not found';

    return (
      <div className="min-h-screen pb-8">
        {/* Header - matching employee pages */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Schedule a Visit</h1>
          <div className="w-9 sm:w-10" />
        </div>

        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {error ? 'Failed to Load Property' : 'Property Not Found'}
          </h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">{errorMessage}</p>
          <div className="flex gap-3">
            {error && (
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl shadow-md transition-all duration-200 ease-out hover:bg-primary/85 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {isRefetching ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl shadow-sm transition-all duration-200 ease-out hover:bg-secondary/70 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pb-8"
    >
      {/* Header - matching employee pages style */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Schedule a Visit</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6">
        {/* Calendly Embed with Property Summary */}
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Property Summary */}
          <div className="p-3 sm:p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1 truncate">
                  {displayProperty.title}
                </h2>
                <p className="text-sm text-muted-foreground truncate">
                  {displayProperty.location}
                </p>
              </div>
            </div>
          </div>

          {/* Calendly Header */}
          <div className="p-3 sm:p-4 md:p-6 border-b border-border">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
              Select a Date & Time
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Choose your preferred time slot for the property visit
            </p>
          </div>

          {/* Calendly iframe container with loading skeleton */}
          <div className="relative min-h-[500px] sm:min-h-[550px] md:min-h-[600px] lg:min-h-[650px]">
            {/* Calendar Loading Placeholder */}
            {calendlyLoading && (
              <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-muted/5">
                <div className="flex flex-col items-center gap-4 max-w-sm">
                  <Calendar className="w-20 h-20 sm:w-24 sm:h-24 text-primary/40 animate-pulse" />
                  <div className="text-center space-y-2">
                    <p className="text-base sm:text-lg font-semibold text-foreground">Loading Calendar</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Please wait while we prepare your booking calendar...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Calendly iframe */}
            <iframe
              src={buildCalendlyUrl()}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Book a Visit"
              className="absolute inset-0 w-full h-full rounded-b-xl sm:rounded-b-2xl"
              onLoad={() => {
                if (!hasCalendlyLoaded) {
                  setCalendlyLoading(false);
                  setHasCalendlyLoaded(true);
                }
              }}
              onError={() => setCalendlyLoading(false)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

