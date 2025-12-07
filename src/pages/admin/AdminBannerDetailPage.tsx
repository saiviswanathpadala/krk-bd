import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';

const bannerSchema = z.object({
  imageUrl: z.string().url('Valid image URL is required'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  targetRole: z.enum(['All', 'Agent', 'Customer', 'Employee']).default('All'),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
});

type BannerFormData = z.infer<typeof bannerSchema>;

export const AdminBannerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const isNew = id === 'new';
  const bannerId = isNew ? null : id;

  // Get draft info and pending change info from location state
  const { isDraft, changeId, draftData, bannerId: draftBannerId, isPendingChange, returnFilter } = (location.state as any) || {};
  const backUrl = returnFilter ? `/admin/banners/list?filter=${returnFilter}` : '/admin/banners/list';
  const actualBannerId = draftBannerId || bannerId;

  const [isEditing, setIsEditing] = useState(isNew || isDraft);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestChangesDialog, setShowRequestChangesDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestChangesReason, setRequestChangesReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);

  // Check if bannerId is a UUID (pending change ID) or numeric
  const isUUID = bannerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bannerId);
  const isNumeric = bannerId && !isNaN(parseInt(bannerId));

  const shouldFetchBanner = !!token && !isNew && !!bannerId && !isDraft && !isPendingChange;

  const {
    data: bannersListResponse,
    isLoading,
    error,
    refetch: refetchBanner,
  } = useQuery({
    queryKey: ['admin-banners-list', 'approved'],
    queryFn: async () => {
      const response = await adminAPI.getBanners(token!, { status: 'approved' });
      return response;
    },
    enabled: shouldFetchBanner,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const allBanners = bannersListResponse?.data?.data || bannersListResponse?.data || [];
  const banner = Array.isArray(allBanners) ? allBanners.find((b: any) => b.id === bannerId) : null;

  // Fetch pending changes for this banner
  // If changeId is provided from location state, fetch that specific change
  // Otherwise, fetch all pending changes and find the one for this banner
  const { data: pendingChangesResponse, isLoading: isLoadingChanges } = useQuery({
    queryKey: ['admin-pending-changes', 'banner', bannerId, changeId],
    queryFn: async () => {
      if (changeId && isPendingChange) {
        // Fetch specific pending change by ID
        const response = await adminAPI.getPendingChangeById(token!, changeId);
        return { data: [response.data] };
      } else {
        // Fetch all pending changes for banners
        const response = await adminAPI.getPendingChanges(token!, {
          type: 'banner',
          limit: 100,
        });
        return response.data;
      }
    },
    enabled: !!token && !isNew && (!!bannerId || !!changeId) && !isDraft,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const pendingChanges = Array.isArray(pendingChangesResponse?.data) 
    ? pendingChangesResponse.data 
    : Array.isArray(pendingChangesResponse) 
    ? pendingChangesResponse 
    : [];

  // Find pending change for this banner
  // If changeId is provided, use that; otherwise find by bannerId
  const pendingChange = changeId && isPendingChange
    ? pendingChanges.find((c: any) => c.id === changeId) || null
    : pendingChanges.find((c: any) => 
        (c.targetId === bannerId || c.bannerId === parseInt(bannerId || '0') || c.targetId?.toString() === bannerId) && 
        c.status === 'pending' && 
        !c.isDraft
      ) || null;

  // Merge pending change with banner data (like employees do)
  let displayBanner: any = null;
  if (pendingChange?.proposedPayload) {
    if (banner) {
      // Existing banner with pending changes
      displayBanner = {
        ...banner,
        imageUrl: pendingChange.proposedPayload.imageUrl || banner.imageUrl,
        title: pendingChange.proposedPayload.title || banner.title,
        subtitle: pendingChange.proposedPayload.subtitle || banner.subtitle,
        targetRole: pendingChange.proposedPayload.targetRole || banner.targetRole,
        isActive: pendingChange.proposedPayload.isActive !== undefined ? pendingChange.proposedPayload.isActive : banner.isActive,
        displayOrder: pendingChange.proposedPayload.displayOrder !== undefined ? pendingChange.proposedPayload.displayOrder : banner.displayOrder,
      };
    } else {
      // New banner (pending change for new banner)
      displayBanner = {
        id: pendingChange.id,
        imageUrl: pendingChange.proposedPayload.imageUrl || '',
        title: pendingChange.proposedPayload.title || 'New Banner',
        subtitle: pendingChange.proposedPayload.subtitle || '',
        targetRole: pendingChange.proposedPayload.targetRole || 'All',
        isActive: pendingChange.proposedPayload.isActive || false,
        displayOrder: pendingChange.proposedPayload.displayOrder || 0,
        createdAt: pendingChange.createdAt,
      };
    }
  } else if (banner) {
    displayBanner = banner;
  }

  const hasPendingChanges = !!pendingChange;

  const form = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: draftData || banner || {
      imageUrl: '',
      title: '',
      subtitle: '',
      targetRole: 'All',
      isActive: true,
      displayOrder: 0,
    },
  });

  useEffect(() => {
    if (draftData) {
      form.reset({
        imageUrl: draftData.imageUrl || '',
        title: draftData.title || '',
        subtitle: draftData.subtitle || '',
        targetRole: draftData.targetRole || 'All',
        isActive: draftData.isActive ?? true,
        displayOrder: draftData.displayOrder || 0,
      });
    } else if (banner && !isNew) {
      form.reset({
        imageUrl: banner.imageUrl || '',
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        targetRole: (banner.targetRole as any) || 'All',
        isActive: banner.isActive ?? true,
        displayOrder: banner.displayOrder || 0,
      });
    }
  }, [banner, draftData, isNew, form]);

  const createMutation = useMutation({
    mutationFn: (data: BannerFormData) => adminAPI.createBanner(token!, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Banner created successfully');
      navigate(`/admin/banners/${data.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create banner');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BannerFormData) => {
      const numId = parseInt(bannerId!);
      return adminAPI.updateBanner(token!, isNaN(numId) ? 0 : numId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banner', bannerId] });
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Banner updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update banner');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!bannerId) throw new Error('Banner ID is required');
      return adminAPI.deleteBanner(token!, bannerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Banner deleted successfully');
      navigate(backUrl);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete banner');
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      if (isDraft && changeId) {
        return adminAPI.updateBannerDraft(token!, changeId, data);
      }
      return adminAPI.createBannerDraft(token!, actualBannerId ? parseInt(actualBannerId) : undefined, data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      toast.success('Draft saved successfully');
      if (isDraft && changeId) {
        // Stay on the same page
        return;
      }
      // Navigate to the draft
      const draftId = response.data?.id || changeId;
      navigate(`/admin/banners/${draftId}`, {
        state: { isDraft: true, changeId: draftId, draftData: data },
        replace: true,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    },
  });

  const submitDraftMutation = useMutation({
    mutationFn: async (data?: BannerFormData) => {
      if (data && changeId) {
        await adminAPI.updateBannerDraft(token!, changeId, data);
      }
      return adminAPI.submitBannerDraft(token!, changeId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      toast.success('Draft submitted for approval');
      navigate('/admin/banners/list', { state: { activeFilter: 'pending' } });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Pending change already exists');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to submit draft');
      }
    },
  });

  const handleSaveDraft = async () => {
    if (savingDraft || submitDraftMutation.isPending) return;
    
    const data = form.getValues();
    if (!data.title || !data.subtitle || !data.imageUrl) {
      toast.error('Title, subtitle, and image URL are required');
      return;
    }

    setSavingDraft(true);
    try {
      await saveDraftMutation.mutateAsync(data);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!changeId || !isDraft) return;
    const data = form.getValues();
    if (!data.title || !data.subtitle || !data.imageUrl) {
      toast.error('Title, subtitle, and image URL are required');
      return;
    }
    submitDraftMutation.mutate(data);
  };

  const onSubmit = (data: BannerFormData) => {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  if ((isLoading || isLoadingChanges) && !isNew) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate(backUrl)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Skeleton className="w-full h-48 sm:h-64 md:h-80" />
          </div>
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <Skeleton className="h-6 sm:h-7 md:h-8 w-3/4 mb-2 sm:mb-3" />
            <Skeleton className="h-4 sm:h-5 w-1/2 mb-3 sm:mb-4" />
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Skeleton className="h-7 sm:h-8 w-20 sm:w-24 rounded-lg" />
              <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-11 sm:h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate(backUrl)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">Failed to Load Banner</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">Unable to fetch banner details. Please try again.</p>
          <button
            onClick={() => refetchBanner()}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!displayBanner && !isNew && !isEditing) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate(backUrl)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">Banner Not Found</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">This banner may have been deleted or doesn't exist.</p>
          <button
            onClick={() => navigate(backUrl)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate(backUrl)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">
            {isNew ? 'New Banner' : isEditing ? 'Edit Banner' : 'Banner Details'}
          </h1>
          <div className="w-9 sm:w-10" />
      </div>

      {!isEditing && !isNew && displayBanner ? (
          <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4 mt-2">
            {/* Pending Changes Indicator */}
            {hasPendingChanges && pendingChange && (
              <div className="bg-orange-500/20 border border-orange-500 rounded-xl p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">⚠️ Pending Changes</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-3">
                  This banner has pending changes awaiting review. The details below show the proposed changes.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setShowApproveDialog(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm sm:text-base transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectDialog(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium text-sm sm:text-base transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => setShowRequestChangesDialog(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm sm:text-base transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Request Changes
                  </button>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <img 
                src={displayBanner.imageUrl} 
                alt={displayBanner.title} 
                className="w-full h-48 sm:h-64 md:h-80 object-cover" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Banner';
                }} 
              />
            </div>

            <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">{displayBanner.title}</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3">{displayBanner.subtitle}</p>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary/10 text-primary rounded-lg text-xs sm:text-sm font-medium">
                  Target: {displayBanner.targetRole}
                </span>
                <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white flex items-center gap-1 ${
                  displayBanner.isActive ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {displayBanner.isActive ? (
                    <>
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => navigate(`/admin/banners/${bannerId}/edit`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base hover:bg-primary/90 transition-colors"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteMutation.isPending}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-destructive/90 transition-colors"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-3 sm:px-4 pt-3 sm:pt-4 mt-2">
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Banner Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Image URL *</label>
                  <input
                    {...form.register('imageUrl')}
                    disabled={!isEditing}
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted text-foreground"
                  />
                  {form.formState.errors.imageUrl && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.imageUrl.message}</p>
                  )}
                  {form.watch('imageUrl') && (
                    <img
                      src={form.watch('imageUrl')}
                      alt="Preview"
                      className="mt-2 w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
                  <input
                    {...form.register('title')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted text-foreground"
                  />
                  {form.formState.errors.title && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Subtitle *</label>
                  <input
                    {...form.register('subtitle')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted text-foreground"
                  />
                  {form.formState.errors.subtitle && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.subtitle.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Target Role</label>
                  <select
                    {...form.register('targetRole')}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted text-foreground"
                  >
                    <option value="All">All</option>
                    <option value="Agent">Agent</option>
                    <option value="Customer">Customer</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    {...form.register('isActive')}
                    type="checkbox"
                    disabled={!isEditing}
                    className="w-4 h-4 text-primary rounded focus:ring-primary disabled:opacity-50"
                  />
                  <label className="text-sm font-medium text-foreground">Active</label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Display Order</label>
                  <input
                    {...form.register('displayOrder', { valueAsNumber: true })}
                    type="number"
                    disabled={!isEditing}
                    min="0"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted text-foreground"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 sm:gap-3 mb-4">
                {isDraft ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSubmitDraft}
                      disabled={submitDraftMutation.isPending || savingDraft}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      {submitDraftMutation.isPending ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      Submit for Approval
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={savingDraft || submitDraftMutation.isPending}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-secondary/90 transition-colors"
                    >
                      {savingDraft ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/banners/list', { state: { activeFilter: 'draft' } })}
                      className="px-4 py-2.5 sm:py-3 bg-slate-200 text-slate-700 rounded-lg font-medium text-sm sm:text-base hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      {isNew ? 'Create Banner' : 'Save Changes'}
                    </button>
                    {!isNew && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={deleteMutation.isPending}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-destructive/90 transition-colors"
                      >
                        {deleteMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            Delete
                          </>
                        )}
                      </button>
                    )}
                    {!isNew && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2.5 sm:py-3 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm sm:text-base hover:bg-secondary/90 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this change?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={isApproving} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsApproving(true);
                adminAPI.approvePendingChange(token!, pendingChange!.id)
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
                    toast.success('Change approved successfully');
                    navigate(backUrl);
                  })
                  .catch((err: any) => {
                    toast.error(err.response?.data?.message || 'Failed to approve change');
                  })
                  .finally(() => { setIsApproving(false); setShowApproveDialog(false); });
              }}
              disabled={isApproving}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Changes</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection:
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            disabled={isRejecting}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] disabled:opacity-50"
          />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }} disabled={isRejecting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectReason.trim()) {
                  setIsRejecting(true);
                  adminAPI.rejectPendingChange(token!, pendingChange!.id, { reason: rejectReason.trim() })
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
                      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
                      toast.success('Change rejected');
                      navigate(backUrl);
                    })
                    .catch((err: any) => {
                      toast.error(err.response?.data?.message || 'Failed to reject change');
                    })
                    .finally(() => { setIsRejecting(false); setShowRejectDialog(false); setRejectReason(''); });
                }
              }}
              disabled={!rejectReason.trim() || isRejecting}
              className="w-full sm:w-auto"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showRequestChangesDialog} onOpenChange={setShowRequestChangesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Please provide comments for requested changes:
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={requestChangesReason}
            onChange={(e) => setRequestChangesReason(e.target.value)}
            placeholder="Enter your comments..."
            disabled={isRequestingChanges}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] disabled:opacity-50"
          />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setShowRequestChangesDialog(false); setRequestChangesReason(''); }} disabled={isRequestingChanges} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (requestChangesReason.trim()) {
                  setIsRequestingChanges(true);
                  adminAPI.requestChanges(token!, pendingChange!.id, { reason: requestChangesReason.trim() })
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
                      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
                      toast.success('Revision requested');
                      navigate(backUrl);
                    })
                    .catch((err: any) => {
                      toast.error(err.response?.data?.message || 'Failed to request changes');
                    })
                    .finally(() => { setIsRequestingChanges(false); setShowRequestChangesDialog(false); setRequestChangesReason(''); });
                }
              }}
              disabled={!requestChangesReason.trim() || isRequestingChanges}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
            >
              {isRequestingChanges ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                'Request Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
