import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI, uploadAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface BannerFormData {
  imageUrl: string;
  title: string;
  subtitle: string;
  targetRole: 'All' | 'Agent' | 'Customer' | 'Employee';
  isActive: boolean;
}

export const EmployeeBannerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const { changeId, isDraft, isNeedsRevision, draftData, reason, activeFilter, bannerId: stateBannerId } = (location.state as any) || {};

  const [formData, setFormData] = useState<BannerFormData>({
    imageUrl: '',
    title: '',
    subtitle: '',
    targetRole: 'All',
    isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const isNew = id === 'new';
  const bannerId = isNew ? null : id;

  const { data: bannerResponse, isLoading } = useQuery({
    queryKey: ['employee-banner', bannerId || changeId],
    queryFn: async () => {
      if (bannerId && !isDraft) {
        return await employeeAPI.getBannerById(token!, bannerId);
      }
      if (changeId && !draftData) {
        const response = await employeeAPI.getBannerPendingChanges(token!, { limit: 100 });
        const change = response.data.data.find((c: any) => c.id === changeId);
        return { data: change?.proposedPayload };
      }
      return { data: null };
    },
    enabled: !!token && ((!!bannerId && !isDraft) || (!!changeId && !draftData)),
  });

  useEffect(() => {
    if (draftData) {
      setFormData({
        imageUrl: draftData.imageUrl || '',
        title: draftData.title || '',
        subtitle: draftData.subtitle || '',
        targetRole: draftData.targetRole || 'All',
        isActive: draftData.isActive !== undefined ? draftData.isActive : true,
      });
    } else if (bannerResponse?.data) {
      const banner = bannerResponse.data.data || bannerResponse.data;
      if (banner) {
        setFormData({
          imageUrl: banner.imageUrl || '',
          title: banner.title || '',
          subtitle: banner.subtitle || '',
          targetRole: banner.targetRole || 'All',
          isActive: banner.isActive !== undefined ? banner.isActive : true,
        });
      }
    }
  }, [bannerResponse, draftData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await uploadAPI.getSignedUrl(
        token!,
        file.name,
        file.type,
        'banner',
        file.size
      );
      await uploadAPI.uploadToR2(data.uploadUrl, file, file.type);
      setFormData(prev => ({ ...prev, imageUrl: data.publicUrl }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    }
    setUploading(false);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => employeeAPI.createBanner(token!, { proposed_payload: data, isDraft: false }, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      queryClient.invalidateQueries({ queryKey: ['employee-all-banner-pending-changes'] });
      toast.success('Banner submitted for approval');
      navigate('/employee/banners', { state: { activeFilter: activeFilter || 'all' }, replace: true });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Pending change already exists');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to create banner');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => employeeAPI.submitBannerPendingChange(token!, bannerId!, { proposed_payload: data, isDraft: false }, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      queryClient.invalidateQueries({ queryKey: ['employee-banner', bannerId] });
      queryClient.invalidateQueries({ queryKey: ['employee-all-banner-pending-changes'] });
      toast.success('Changes submitted for approval');
      navigate('/employee/banners', { state: { activeFilter: activeFilter || 'all' }, replace: true });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Pending change already exists');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to submit changes');
      }
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: (data: any) => {
      if (changeId && isDraft) {
        return employeeAPI.updateBannerDraft(token!, changeId, data);
      }
      if (bannerId) {
        return employeeAPI.submitBannerPendingChange(token!, bannerId, { proposed_payload: data, isDraft: true }, true);
      }
      return employeeAPI.createBanner(token!, { proposed_payload: data, isDraft: true }, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      queryClient.invalidateQueries({ queryKey: ['employee-all-banner-pending-changes'] });
      toast.success('Draft saved');
      navigate('/employee/banners', { state: { activeFilter: 'drafts' }, replace: true });
    },
    onError: () => {
      toast.error('Failed to save draft');
    },
  });

  const submitDraftMutation = useMutation({
    mutationFn: async (data?: typeof formData) => {
      if (data) {
        await employeeAPI.updateBannerDraft(token!, changeId!, data);
      }
      return employeeAPI.submitBannerDraft(token!, changeId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      queryClient.invalidateQueries({ queryKey: ['employee-all-banner-pending-changes'] });
      toast.success('Draft submitted for approval');
      navigate('/employee/banners', { state: { activeFilter: 'pending' }, replace: true });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Pending change already exists');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to submit draft');
      }
    },
  });

  const submitNeedsRevisionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await employeeAPI.updateBannerDraft(token!, changeId!, data);
      await employeeAPI.submitBannerDraft(token!, changeId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      if (bannerId || stateBannerId) {
        queryClient.invalidateQueries({ queryKey: ['employee-banner', bannerId || stateBannerId] });
      }
      queryClient.invalidateQueries({ queryKey: ['employee-all-banner-pending-changes'] });
      toast.success('Changes submitted for approval');
      navigate('/employee/banners', { state: { activeFilter: 'pending' }, replace: true });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Pending change already exists');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to submit changes');
      }
    },
  });

  const createDraftFromRevisionMutation = useMutation({
    mutationFn: ({ targetBannerId, data }: { targetBannerId: string; data: typeof formData }) =>
      employeeAPI.submitBannerPendingChange(token!, targetBannerId, { proposed_payload: data, isDraft: true }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      queryClient.invalidateQueries({ queryKey: ['employee-all-banner-pending-changes'] });
      toast.success('Draft saved');
      navigate('/employee/banners', { state: { activeFilter: 'drafts' }, replace: true });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to save draft');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      return toast.error('Title and image are required');
    }

    if (isNeedsRevision && changeId) {
      submitNeedsRevisionMutation.mutate(formData);
    } else if (isDraft && changeId) {
      submitDraftMutation.mutate(formData);
    } else if (bannerId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSaveDraft = () => {
    if (!formData.title || !formData.imageUrl) {
      return toast.error('Title and image are required');
    }

    if (isNeedsRevision) {
      const resolvedBannerId = bannerId || bannerResponse?.data?.data?.id || bannerResponse?.data?.id;
      if (!changeId) {
        return toast.error('Unable to save draft. Change information is missing.');
      }
      if (resolvedBannerId) {
        createDraftFromRevisionMutation.mutate({ targetBannerId: resolvedBannerId, data: formData });
      } else {
        saveDraftMutation.mutate(formData);
      }
      return;
    }

    saveDraftMutation.mutate(formData);
  };

  const handleDiscard = () => {
    if (!changeId || !isDraft) return;
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    setIsDiscarding(true);
    setShowDiscardDialog(false);
    employeeAPI.discardBannerDraft(token!, changeId!)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
        toast.success('Draft discarded');
        navigate('/employee/banners', { state: { activeFilter: 'drafts' }, replace: true });
      })
      .catch(() => {
        toast.error('Failed to discard draft');
      })
      .finally(() => {
        setIsDiscarding(false);
      });
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    saveDraftMutation.isPending ||
    submitDraftMutation.isPending ||
    submitNeedsRevisionMutation.isPending ||
    createDraftFromRevisionMutation.isPending ||
    isDiscarding;

  if (isLoading && !draftData) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate('/employee/banners')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">{isNew ? 'Create' : 'Edit'} Banner</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="px-4 sm:px-6 pt-4 pb-8 max-w-4xl mx-auto">
          <Skeleton className="h-48 w-full rounded-xl mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button onClick={() => navigate('/employee/banners', { state: { activeFilter: isDraft ? 'drafts' : (activeFilter || 'all') }, replace: true })} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">{isNew ? 'Create' : 'Edit'} Banner</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-4 sm:px-6 pt-4 pb-8 max-w-4xl mx-auto">
        {isNeedsRevision && reason && (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-3 sm:p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-1.5">📝 Admin Requested Changes</h3>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>
        )}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Banner Details</h3>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Banner Image *</label>
          <div className="relative border-2 border-dashed border-border rounded-xl overflow-hidden mb-4">
            {formData.imageUrl ? (
              <img src={formData.imageUrl} alt="Banner" className="w-full h-48 sm:h-56 md:h-64 object-cover" />
            ) : (
              <div className="h-48 sm:h-56 md:h-64 flex flex-col items-center justify-center bg-muted">
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload'}</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
          </div>

          <label className="block text-sm font-medium text-muted-foreground mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Enter banner title"
          />

          <label className="block text-sm font-medium text-muted-foreground mb-2">Subtitle *</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Enter banner subtitle"
          />

          <label className="block text-sm font-medium text-muted-foreground mb-2">Target Role</label>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['All', 'Agent', 'Customer', 'Employee'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData({ ...formData, targetRole: role })}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                  formData.targetRole === role
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-accent'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-muted-foreground mb-2">Status</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: true })}
              className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                formData.isActive
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: false })}
              className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                !formData.isActive
                  ? 'bg-gray-500 text-white border-gray-500'
                  : 'bg-background text-foreground border-border hover:bg-accent'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isNeedsRevision && changeId ? (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || uploading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-secondary text-secondary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {(createDraftFromRevisionMutation.isPending || saveDraftMutation.isPending) ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="submit"
                disabled={isSaving || uploading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {submitNeedsRevisionMutation.isPending ? 'Submitting...' : 'Submit Changes'}
              </button>
            </>
          ) : isDraft && changeId ? (
            <>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSaving || uploading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-destructive text-destructive-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {isDiscarding ? 'Discarding...' : 'Discard'}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || uploading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-secondary text-secondary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="submit"
                disabled={isSaving || uploading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {submitDraftMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || uploading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-secondary text-secondary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="submit"
                disabled={isSaving || uploading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
              >
                {(createMutation.isPending || updateMutation.isPending || submitDraftMutation.isPending) ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDiscardDialog(false)}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Discard Draft</h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Are you sure you want to discard this draft? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowDiscardDialog(false)}
                className="flex-1 px-4 py-2 sm:py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscard}
                disabled={isDiscarding}
                className="flex-1 px-4 py-2 sm:py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isDiscarding ? 'Discarding...' : 'Discard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
