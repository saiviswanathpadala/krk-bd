import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Tag, 
  Check, 
  FileText, 
  ExternalLink, 
  Map,
  Calendar,
  Building2,
  Image as ImageIcon,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { propertyAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';


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

// Skeleton loader component matching actual UI structure
const PropertyDetailsSkeleton = () => (
  <div className="min-h-screen pb-8">
    {/* Header skeleton - matching employee pages style */}
    <div className="bg-card/95 backdrop-blur-sm flex items-center gap-4 px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-7 w-3/4 sm:w-2/3 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-2/5 sm:w-1/3" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Image gallery skeleton */}
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="w-full aspect-[16/10] rounded-2xl" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-lg flex-shrink-0" />
          ))}
        </div>
        
        {/* Description skeleton */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Features & Amenities skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((item) => (
            <div key={item} className="bg-card rounded-2xl border border-border p-6">
              <Skeleton className="h-6 w-24 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar skeleton */}
      <div className="space-y-4">
        {/* Price card skeleton */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-32 mb-3" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        
        {/* Categories skeleton */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        
        {/* Actions skeleton */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
          <Skeleton className="h-4 w-28 mb-3" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>

  </div>
);

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch property with cache
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
    enabled: !!token && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 2,
  });

  // Refetch when page becomes visible (e.g., after editing in another tab/modal)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, refetch]);

  // Refetch when id changes (navigating to different property)
  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id, refetch]);



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

  const allImages = property ? [...(property.images || []), ...(property.gallery || [])] : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (isLoading) {
    return <PropertyDetailsSkeleton />;
  }

  if (error || !property) {
    const errorMessage = error
      ? (error as any)?.response?.status === 404
        ? 'This property may have been removed or is no longer available.'
        : 'Unable to fetch property details. Please check your connection and try again.'
      : 'Property not found';

    return (
      <div className="min-h-screen pb-8">
        {/* Header - matching employee pages style */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center gap-4 px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
          <Link
            to="/home"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
          </div>
        </div>

        {/* Error State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Building2 className="w-16 h-16 text-destructive mb-4" />
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
                  <RefreshCw className="w-4 h-4" />
                )}
                {isRefetching ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            <Link
              to="/home"
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl shadow-sm transition-all duration-200 ease-out hover:bg-secondary/70 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
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
      <div className="bg-card/95 backdrop-blur-sm flex items-center gap-4 px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
        <Link
          to="/home"
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate mb-1">
            {property.title}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">{property.location}</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Gallery */}
        <div className="lg:col-span-2 space-y-4">
          {allImages.length > 0 ? (
            <>
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={allImages[currentImageIndex]}
                    alt={`${property.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-[16/10] rounded-2xl bg-muted flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">No images available</p>
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Features & Amenities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {property.features && property.features.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Features</h3>
                <div className="space-y-2">
                  {property.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Amenities</h3>
                <div className="space-y-2">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-foreground">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Categories */}
          {property.categories && property.categories.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.categories.map((category, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
            
            {property.brochureUrl && (
              <a
                href={property.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-all duration-200 ease-out hover:bg-primary/85 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileText className="w-5 h-5" />
                Download Brochure
              </a>
            )}
            
            {property.website && (
              <a
                href={property.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium shadow-sm transition-all duration-200 ease-out hover:bg-secondary/70 hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ExternalLink className="w-5 h-5" />
                Visit Website
              </a>
            )}
            
            {property.map && (
              <a
                href={property.map}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-border rounded-xl font-medium shadow-sm transition-all duration-200 ease-out hover:bg-muted hover:border-primary/30 hover:shadow-md hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Map className="w-5 h-5" />
                View on Map
              </a>
            )}
          </div>
        </div>
        </div>

        {user?.role?.toLowerCase() !== 'agent' && (
        <>
        {/* Schedule a Visit Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Schedule a Visit</h2>
                  <p className="text-sm text-muted-foreground">
                    Book a time slot to visit this property
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Schedule Button */}
              <button
                onClick={() => navigate(`/property/${id}/schedule-visit`, { state: { property } })}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="w-6 h-6" />
                Schedule a Visit
              </button>

              {/* Property Summary */}
              <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">Scheduling for:</p>
                <p className="font-semibold text-foreground">{property.title}</p>
                <p className="text-sm text-muted-foreground">{property.location}</p>
              </div>
            </div>
          </div>
          </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

