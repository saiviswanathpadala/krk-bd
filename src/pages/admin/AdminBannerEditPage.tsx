import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { adminAPI, uploadAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface BannerFormData {
  imageUrl: string;
  title: string;
  subtitle: string;
  targetRole: 'All' | 'Agent' | 'Customer' | 'Employee';
  isActive: boolean;
}

export const AdminBannerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnFilter = (location.state as any)?.returnFilter || 'all';
  const backUrl = `/admin/banners/list?filter=${returnFilter}`;
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const [formData, setFormData] = useState<BannerFormData>({
    imageUrl: '',
    title: '',
    subtitle: '',
    targetRole: 'All',
    isActive: true,
  });
  const [uploading, setUploading] = useState(false);

  const isNew = id === 'new';
  const bannerId = isNew ? null : id;

  const { data: bannersListResponse, isLoading } = useQuery({
    queryKey: ['admin-banners-list', 'approved'],
    queryFn: async () => {
      const response = await adminAPI.getBanners(token!, { status: 'approved' });
      return response;
    },
    enabled: !!token && !isNew && !!bannerId,
  });

  const allBanners = bannersListResponse?.data?.data || bannersListResponse?.data || [];
  const banner = Array.isArray(allBanners) ? allBanners.find((b: any) => b.id === bannerId) : null;

  useEffect(() => {
    if (banner && !isNew) {
      setFormData({
        imageUrl: banner.imageUrl || '',
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        targetRole: banner.targetRole || 'All',
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
    }
  }, [banner, isNew]);

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
    mutationFn: (data: BannerFormData) => adminAPI.createBanner(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Banner created successfully');
      navigate(backUrl);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create banner');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BannerFormData) => {
      return adminAPI.updateBanner(token!, bannerId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Banner updated successfully');
      navigate(`/admin/banners/${bannerId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update banner');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl || !formData.subtitle) {
      return toast.error('Title, subtitle and image are required');
    }

    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading && !isNew) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Edit Banner</h1>
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
        <button onClick={() => navigate(backUrl)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">{isNew ? 'Create' : 'Edit'} Banner</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-4 sm:px-6 pt-4 pb-8 max-w-4xl mx-auto">
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

        <button
          type="submit"
          disabled={isSaving || uploading}
          className="w-full px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? (isNew ? 'Creating...' : 'Updating...') : isNew ? 'Create Banner' : 'Update Banner'}
        </button>
      </form>
    </div>
  );
};
