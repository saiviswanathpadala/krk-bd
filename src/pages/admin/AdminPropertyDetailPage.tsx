import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Images,
  ExternalLink,
  Map,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface Property {
  id: string;
  title: string;
  location: string;
  price?: string;
  images: string[];
  gallery?: string[];
  description?: string;
  type: string;
  propertyStatus: string;
  amenities?: string[];
  features?: string[];
  brochureUrl?: string;
  map?: string;
  website?: string;
  createdAt: string;
  pendingChanges?: any[];
}

const PropertyDetailsSkeleton = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen pb-8">
    {/* Static Header */}
    <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
      <button
        onClick={onBack}
        className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      </button>
      <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
      <div className="w-9 sm:w-10" />
    </div>

    <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
      {/* Image Skeleton */}
      <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 md:p-6">
        <Skeleton className="h-48 sm:h-64 md:h-96 w-full rounded-xl" />
      </div>

      {/* Property Info Skeleton */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
        <Skeleton className="h-7 w-3/4 mb-3" />
        <Skeleton className="h-5 w-1/2 mb-3" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Description Skeleton */}
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Features/Amenities Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="flex gap-2 sm:gap-3">
        <Skeleton className="flex-1 h-11 rounded-lg" />
        <Skeleton className="w-24 h-11 rounded-lg" />
      </div>
    </div>
  </div>
);

export const AdminPropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string}>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const returnFilter = (location.state as any)?.returnFilter || 'all';
  const returnTo = (location.state as any)?.returnTo || `/admin/properties/list?filter=${returnFilter}`;
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const carouselIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return 'Price on request';
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[₹,]/g, '')) : price;
    if (isNaN(numPrice)) return 'Price on request';
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  // Get cached data for optimistic UI
  const cachedData = queryClient.getQueryData(['admin-property', id]) as any;

  const {
    data: propertyResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-property', id],
    queryFn: async () => {
      const response = await adminAPI.getPropertyById(token!, id!);
      return response.data;
    },
    enabled: !!token && !!id,
    initialData: cachedData,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData || cachedData,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const property: Property | null = propertyResponse?.data || propertyResponse || null;

  // Track carousel selection
  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      setCurrentImageIndex(carouselApi.selectedScrollSnap());
    };
    
    carouselApi.on('select', onSelect);
    onSelect();
    
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  // Auto-rotating carousel
  useEffect(() => {
    const thumbnailImages = property?.images || [];
    if (thumbnailImages.length > 1 && !showGallery && carouselApi) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => {
          const nextIndex = (prev + 1) % thumbnailImages.length;
          if (nextIndex === 0) {
            carouselApi.scrollTo(0, false);
          } else {
            carouselApi.scrollTo(nextIndex);
          }
          return nextIndex;
        });
      }, 3500);
    }
    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [property?.images, showGallery, carouselApi]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, []);

  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deleteProperty(token!, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Property deleted successfully');
      navigate(returnTo);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  const thumbnailImages = property?.images?.length ? property.images : [];
  const galleryImages = property?.gallery || [];
  const allImages = [...thumbnailImages, ...galleryImages];

  const handleGalleryOpen = () => {
    if (allImages.length > 0) {
      setShowGallery(true);
      setCurrentImageIndex(0);
    }
  };

  const getFeatureIcon = (feature: string) => {
    const lower = feature.toLowerCase();
    if (lower.includes('bedroom') || lower.includes('bhk')) return '🛏️';
    if (lower.includes('bathroom')) return '🚿';
    if (lower.includes('sqft') || lower.includes('area') || lower.includes('sq')) return '📐';
    if (lower.includes('built') || lower.includes('year')) return '📅';
    if (lower.includes('penthouse') || lower.includes('townhouse') || lower.includes('villa')) return '🏠';
    return '✅';
  };

  // Loading State
  if (isLoading && !property) {
    return <PropertyDetailsSkeleton onBack={() => navigate('/admin/properties/list')} />;
  }

  // Error State
  if (error && !property) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/admin/properties/list')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
          <div className="w-9 sm:w-10" />
        </div>

        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Failed to Load Property</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Unable to fetch property details. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mx-auto shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-sm sm:text-base font-semibold">{isFetching ? 'Retrying...' : 'Try Again'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (!property) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/admin/properties/list')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
          <div className="w-9 sm:w-10" />
        </div>

        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="text-center max-w-md">
            <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Property Not Found</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              This property may have been deleted or doesn't exist.
            </p>
            <button
              onClick={() => navigate('/admin/properties/list')}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mx-auto shadow-md hover:shadow-lg active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm sm:text-base font-semibold">Go Back</span>
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
          onClick={() => navigate(returnTo)}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
        {/* Pending Changes Indicator */}
        {property.pendingChanges && property.pendingChanges.length > 0 && (
          <div className="bg-orange-500/20 border border-orange-500 rounded-xl p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
              ⚠️ Pending Changes ({property.pendingChanges.length})
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This property has pending changes awaiting review
            </p>
          </div>
        )}

        {/* Images */}
        {thumbnailImages.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 md:p-6">
            {thumbnailImages.length === 1 ? (
              <div className="relative h-48 sm:h-64 md:h-96 rounded-xl overflow-hidden cursor-pointer" onClick={handleGalleryOpen}>
                <img 
                  src={thumbnailImages[0]} 
                  alt={property.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="eager"
                />
                {property.type && (
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium shadow-lg">
                    {property.type}
                  </div>
                )}
                {galleryImages.length > 0 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Images className="w-4 h-4" />
                    Gallery
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Carousel className="w-full" opts={{ loop: true }} setApi={setCarouselApi}>
                  <CarouselContent className="-ml-0">
                    {thumbnailImages.map((image: string, index: number) => (
                      <CarouselItem key={index} className="pl-0">
                        <div className="relative h-48 sm:h-64 md:h-96 rounded-xl overflow-hidden cursor-pointer" onClick={handleGalleryOpen}>
                          <img 
                            src={image} 
                            alt={`${property.title} - Image ${index + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading={index === 0 ? 'eager' : 'lazy'}
                          />
                          {property.type && index === currentImageIndex && (
                            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium shadow-lg">
                              {property.type}
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2 sm:left-4" />
                  <CarouselNext className="right-2 sm:right-4" />
                </Carousel>
                
                {/* Pagination Dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {thumbnailImages.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? 'w-6 bg-primary' : 'w-2 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Gallery Button */}
                {galleryImages.length > 0 && (
                  <button
                    onClick={handleGalleryOpen}
                    className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-black/80 transition-colors"
                  >
                    <Images className="w-4 h-4" />
                    Gallery
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 md:p-6">
            <div className="relative h-48 sm:h-64 md:h-96 rounded-xl overflow-hidden bg-muted flex flex-col items-center justify-center">
              <Building2 className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-muted-foreground mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground text-center">No images available</p>
            </div>
          </div>
        )}

        {/* Property Info */}
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">{property.title}</h2>
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-sm sm:text-base">{property.location}</span>
          </div>
          {property.price && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-lg sm:text-xl md:text-2xl font-semibold text-primary">
                {formatPrice(property.price)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {property.description && (
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* Features & Amenities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {property.features && property.features.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Features</h3>
              <div className="grid grid-cols-1 gap-2">
                {property.features.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-base sm:text-lg flex-shrink-0">{getFeatureIcon(feature)}</span>
                    <span className="text-sm sm:text-base text-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {(galleryImages.length > 0 || property.brochureUrl || property.website || property.map) && (
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {galleryImages.length > 0 && (
                <button
                  onClick={handleGalleryOpen}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Gallery
                </button>
              )}
              {property.brochureUrl && (
                <a 
                  href={property.brochureUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-secondary text-secondary-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Brochure
                </a>
              )}
              {property.website && (
                <a 
                  href={property.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-border rounded-lg text-xs sm:text-sm font-medium hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Website
                </a>
              )}
              {property.map && (
                <a 
                  href={property.map} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-border rounded-lg text-xs sm:text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Map
                </a>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => navigate(`/admin/properties/${id}/edit`)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base hover:bg-primary/90 transition-colors"
          >
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteMutation.isPending}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-destructive/90 transition-colors"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Delete Property</h2>
                <button onClick={() => setShowDeleteModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete <span className="font-semibold text-foreground">{property?.title}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {allImages.length > 0 && (
              <>
                <img
                  src={allImages[currentImageIndex]}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % allImages.length)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
