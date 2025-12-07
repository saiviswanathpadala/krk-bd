import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, X, Building2, MapPin, DollarSign, FileText, ExternalLink, Map, Check, AlertCircle, RefreshCw, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  EMPLOYEE_PROPERTY_PENDING_CHANGES_DETAIL_KEY,
  EMPLOYEE_PROPERTY_PENDING_CHANGES_LIST_KEY,
} from '@/constants/queryKeys';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';

interface Property {
  id: string;
  title: string;
  location: string;
  price?: string | number | null;
  type: string;
  description?: string;
  images: string[];
  gallery?: string[];
  features?: string[];
  amenities?: string[];
  brochureUrl?: string;
  map?: string;
  website?: string;
  createdAt: string;
  pendingChanges?: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

interface PendingChange {
  id: string;
  propertyId?: string;
  status: string;
  isDraft?: boolean;
  proposedPayload?: Partial<Property>;
  reason?: string;
  createdAt: string;
}

interface LocationState {
  from?: string;
}

export const EmployeePropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAction, setWithdrawAction] = useState<'discard' | 'draft' | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [carouselApi, setCarouselApi] = useState<any>(null);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['employee-properties'], exact: false });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_LIST_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_DETAIL_KEY, exact: false });
    };
  }, [queryClient]);

  const isNew = id === 'new';
  const isEdit = window.location.pathname.includes('/edit');
  const propertyId = isNew ? null : id;

  const { data: propertyResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['employee-property', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const response = await employeeAPI.getPropertyById(token!, propertyId);
      return response.data;
    },
    enabled: !!token && !!propertyId && !isNew,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const locationState = location.state as any;
  const changeId = locationState?.changeId;
  const isPendingNew = locationState?.isPendingNew;
  const isNeedsRevision = locationState?.isNeedsRevision;

  const { data: pendingChangesResponse, isLoading: isLoadingChange } = useQuery({
    queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_DETAIL_KEY,
    queryFn: async () => {
      const response = await employeeAPI.getPendingChanges(token!, { limit: 100 });
      return response.data;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const property = propertyResponse?.data || propertyResponse;
  const pendingChanges = Array.isArray(pendingChangesResponse?.data) 
    ? pendingChangesResponse.data 
    : Array.isArray(pendingChangesResponse) 
    ? pendingChangesResponse 
    : [];
  
  const pendingChange = pendingChanges.find((c: PendingChange) => 
    (changeId && c.id === changeId) ||
    (c.propertyId === propertyId && c.status === 'pending' && !c.isDraft) ||
    (c.id === id && !c.propertyId)
  ) || null;

  let displayProperty: Property | null = null;
  
  if ((isPendingNew || isNeedsRevision) && pendingChange?.proposedPayload) {
    displayProperty = {
      id: pendingChange.propertyId || pendingChange.id,
      title: pendingChange.proposedPayload?.title || 'Property',
      location: pendingChange.proposedPayload?.location || '',
      price: pendingChange.proposedPayload?.price,
      type: pendingChange.proposedPayload?.type || (isPendingNew ? 'New Listing' : property?.type || ''),
      description: pendingChange.proposedPayload?.description,
      images: pendingChange.proposedPayload?.images || [],
      gallery: pendingChange.proposedPayload?.gallery || [],
      features: pendingChange.proposedPayload?.features || [],
      amenities: pendingChange.proposedPayload?.amenities || [],
      brochureUrl: pendingChange.proposedPayload?.brochureUrl,
      map: pendingChange.proposedPayload?.map,
      website: pendingChange.proposedPayload?.website,
      createdAt: pendingChange.createdAt,
      pendingChanges: [pendingChange],
    };
  } else if (pendingChange?.proposedPayload && property) {
    displayProperty = {
      ...property,
      title: pendingChange.proposedPayload.title || property.title,
      location: pendingChange.proposedPayload.location || property.location,
      price: pendingChange.proposedPayload.price !== undefined ? pendingChange.proposedPayload.price : property.price,
      description: pendingChange.proposedPayload.description || property.description,
      images: pendingChange.proposedPayload.images || property.images || [],
      gallery: pendingChange.proposedPayload.gallery || property.gallery || [],
      features: pendingChange.proposedPayload.features || property.features || [],
      amenities: pendingChange.proposedPayload.amenities || property.amenities || [],
    };
  } else if (property) {
    displayProperty = {
      ...property,
      images: property.images || [],
      gallery: property.gallery || [],
      features: property.features || [],
      amenities: property.amenities || [],
    };
  }

  const hasPendingChanges = property?.pendingChanges?.length > 0 || (!!pendingChange && !isNeedsRevision && !isPendingNew);

  const withdrawMutation = useMutation({
    mutationFn: async (moveToDraft: boolean) => {
      const changeIdToUse = pendingChange?.id || id;
      await employeeAPI.withdrawPendingChange(token!, changeIdToUse, moveToDraft);
    },
    onSuccess: (_, moveToDraft) => {
      queryClient.invalidateQueries({ queryKey: ['employee-property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['employee-properties'], exact: false });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_LIST_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_DETAIL_KEY, exact: false });
      toast.success(moveToDraft ? 'Moved to drafts' : 'Changes discarded');
      navigate('/employee/properties');
    },
    onError: () => {
      toast.error('Failed to withdraw changes');
      setWithdrawing(false);
      setWithdrawAction(null);
    },
  });

  const handleWithdraw = () => {
    if (!pendingChange || withdrawing) return;
    setShowWithdrawDialog(true);
  };

  const handleWithdrawAction = (action: 'discard' | 'draft') => {
    setWithdrawing(true);
    setWithdrawAction(action);
    setShowWithdrawDialog(false);
    withdrawMutation.mutate(action === 'draft');
  };

  const handleGalleryOpen = () => {
    if (allImages.length > 0) {
      setShowGallery(true);
      setCurrentImageIndex(0);
    }
  };

  // Auto-rotating carousel effect
  useEffect(() => {
    const thumbnailImages = displayProperty?.images || [];
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
  }, [displayProperty?.images, showGallery, carouselApi]);

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

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, []);

  const handleEdit = () => {
    if (isNeedsRevision) {
      navigate(`/employee/properties/${pendingChange?.propertyId || id}/edit`, {
        state: { 
          changeId: pendingChange?.id || changeId,
          isNeedsRevision: true,
          initialDraftData: pendingChange?.proposedPayload,
          reason: pendingChange?.reason || locationState?.reason,
          returnTo: location.pathname,
        }
      });
    } else {
      navigate(`/employee/properties/${propertyId || id}/edit`, {
        state: {
          propertyData: displayProperty,
          returnTo: location.pathname,
        }
      });
    }
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

  if (isNew) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/properties" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Create Property</h1>
          <div className="w-9" />
        </div>
        <div className="px-4 pt-4">
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <p className="text-muted-foreground">Property creation form coming soon...</p>
            <p className="text-sm text-muted-foreground mt-2">Please use the admin panel to create properties.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingChange) {
    return (
      <div className="min-h-screen pb-4 sm:pb-8">
        {/* Static Header - No Skeleton */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/properties" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
          <div className="w-9" />
        </div>
        
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
          {/* Image Carousel Skeleton */}
          <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 md:p-6 animate-pulse">
            <div className="relative">
              <Skeleton className="h-48 sm:h-64 md:h-80 lg:h-96 w-full rounded-xl" />
              {/* Type Badge Skeleton */}
              <div className="absolute top-4 left-4">
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
              {/* Pagination Dots Skeleton */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-2 w-2 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Property Info Skeleton */}
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
            <Skeleton className="h-6 sm:h-7 md:h-8 w-3/4 mb-2 sm:mb-3" />
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
              <Skeleton className="h-5 sm:h-6 md:h-7 w-32" />
            </div>
          </div>

          {/* Description Skeleton */}
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
            <Skeleton className="h-5 sm:h-6 w-28 mb-2 sm:mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Features & Amenities Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* Features Skeleton */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
              <Skeleton className="h-5 sm:h-6 w-20 mb-2 sm:mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <Skeleton className="w-6 h-6 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Amenities Skeleton */}
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
              <Skeleton className="h-5 sm:h-6 w-24 mb-2 sm:mb-3" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-7 w-16 sm:w-20 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
            <Skeleton className="h-5 sm:h-6 w-28 mb-3" />
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 sm:h-10 w-20 sm:w-24 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Action Button Skeleton */}
          <Skeleton className="h-11 sm:h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/properties" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
          <div className="w-9" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">Failed to Load Property</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">Unable to fetch property details. Please try again.</p>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base font-semibold" type="button">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!displayProperty) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/properties" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
          <div className="w-9" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">Property Not Found</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">This property may have been deleted or doesn't exist.</p>
          <Link to="/employee/properties" className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  const thumbnailImages = displayProperty.images || [];
  const galleryImages = displayProperty.gallery || [];
  const allImages = [...thumbnailImages, ...galleryImages];

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['employee-properties'], exact: false });
            queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_LIST_KEY, exact: false });
            queryClient.invalidateQueries({ queryKey: EMPLOYEE_PROPERTY_PENDING_CHANGES_DETAIL_KEY, exact: false });
            
            const { returnTo, returnFilter } = (location.state as any) || {};
            if (returnTo && returnFilter) {
              navigate(returnTo, { state: { activeFilter: returnFilter } });
            } else {
              navigate('/employee/properties');
            }
          }}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" 
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Details</h1>
        <div className="w-9" />
      </div>
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4">

      {thumbnailImages.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 md:p-6">
          {thumbnailImages.length === 1 ? (
            <div className="relative h-48 sm:h-64 md:h-96 rounded-xl overflow-hidden cursor-pointer" onClick={handleGalleryOpen}>
              <img 
                src={thumbnailImages[0]} 
                alt={displayProperty.title} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="eager"
              />
              {/* Property Type Badge */}
              {displayProperty.type && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg">
                  {displayProperty.type}
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
                  {thumbnailImages.map((image, index) => (
                    <CarouselItem key={index} className="pl-0">
                      <div className="relative h-48 sm:h-64 md:h-96 rounded-xl overflow-hidden cursor-pointer" onClick={handleGalleryOpen}>
                        <img 
                          src={image} 
                          alt={`${displayProperty.title} - Image ${index + 1}`} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                        {/* Property Type Badge */}
                        {displayProperty.type && index === currentImageIndex && (
                          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-lg">
                            {displayProperty.type}
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
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
          <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden bg-muted flex flex-col items-center justify-center">
            <Building2 className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-muted-foreground mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground text-center">No images available</p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">{displayProperty.title}</h2>
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm sm:text-base">{displayProperty.location}</span>
        </div>
        {displayProperty.price && (
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <span className="text-lg sm:text-xl md:text-2xl font-semibold text-primary">{formatPrice(displayProperty.price)}</span>
          </div>
        )}
      </div>

      {displayProperty.description && (
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{displayProperty.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {displayProperty.features && displayProperty.features.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Features</h3>
            <div className="grid grid-cols-1 gap-2">
              {displayProperty.features.map((feature, idx) => {
                const getFeatureIcon = (feature: string) => {
                  const lower = feature.toLowerCase();
                  if (lower.includes('bedroom') || lower.includes('bhk')) return '🛏️';
                  if (lower.includes('bathroom')) return '🚿';
                  if (lower.includes('sqft') || lower.includes('area') || lower.includes('sq')) return '📐';
                  if (lower.includes('built') || lower.includes('year')) return '📅';
                  if (lower.includes('penthouse') || lower.includes('townhouse') || lower.includes('villa')) return '🏠';
                  return '✅';
                };
                
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-lg flex-shrink-0">{getFeatureIcon(feature)}</span>
                    <span className="text-sm sm:text-base text-foreground font-medium">{feature}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {displayProperty.amenities && displayProperty.amenities.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {displayProperty.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                  <Check className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(galleryImages.length > 0 || displayProperty.brochureUrl || displayProperty.website || displayProperty.map) && (
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {galleryImages.length > 0 && (
              <button
                onClick={handleGalleryOpen}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-medium hover:opacity-90 transition-opacity"
              >
                <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Gallery
              </button>
            )}
            {displayProperty.brochureUrl && (
              <a href={displayProperty.brochureUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm sm:text-base font-medium hover:opacity-90 transition-opacity">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Brochure
              </a>
            )}
            {displayProperty.website && (
              <a href={displayProperty.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base font-medium hover:bg-accent transition-colors">
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Website
              </a>
            )}
            {displayProperty.map && (
              <a href={displayProperty.map} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base font-medium hover:bg-accent transition-colors">
                <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Map
              </a>
            )}
          </div>
        </div>
      )}

      {isNeedsRevision && pendingChange?.reason && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5">📝 Admin Requested Changes</h3>
          <p className="text-sm sm:text-base text-muted-foreground">{pendingChange.reason}</p>
        </div>
      )}

      {hasPendingChanges && !isNeedsRevision && (
        <div className="bg-orange-500/20 border border-orange-500 rounded-xl p-3 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5">⚠️ Pending Changes</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Your changes are awaiting admin review</p>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        {isNeedsRevision ? (
          <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base hover:bg-primary/90 transition-colors">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            Edit
          </button>
        ) : hasPendingChanges || isPendingNew ? (
          <button onClick={handleWithdraw} disabled={withdrawing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-destructive/90 transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            {withdrawing 
              ? (withdrawAction === 'discard' ? 'Discarding...' : withdrawAction === 'draft' ? 'Moving to Draft...' : 'Withdrawing...')
              : 'Withdraw'
            }
          </button>
        ) : (
          <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base hover:bg-primary/90 transition-colors">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            Edit
          </button>
        )}
      </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Changes</DialogTitle>
            <DialogDescription>
              What would you like to do with your changes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleWithdrawAction('discard')}
              className="w-full sm:w-auto"
            >
              Discard
            </Button>
            <Button
              onClick={() => handleWithdrawAction('draft')}
              className="w-full sm:w-auto"
            >
              Move to Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  alt={`${displayProperty.title} - Image ${currentImageIndex + 1}`}
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
