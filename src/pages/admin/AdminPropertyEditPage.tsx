import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Plus, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { adminAPI, uploadAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface PropertyFormData {
  title: string;
  location: string;
  price: string;
  type: string;
  description: string;
  website: string;
  map: string;
}

const DEFAULT_CATEGORIES = [
  "Apartment/Flat",
  "Builder Floor",
  "Villa/Independent House/Bungalow",
  "Duplex/Penthouse",
  "Plot/Residential Land",
  "Farmhouse",
  "Studio/Serviced Apartment",
  "Retirement Home",
  "Time Share Property"
];

export const AdminPropertyEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  
  const {
    isDraft,
    changeId,
    initialDraftData,
    propertyId: statePropertyId,
    skipLoading,
    returnFilter,
  } = (location.state as any) || {};
  
  const activeFilter = returnFilter || 'all';
  
  // Check if we're on the /new/edit route by checking the pathname
  const isNew = location.pathname.includes('/new/edit') || id === 'new';
  const propertyId = isNew ? null : (statePropertyId || id);
  
  const handleBack = () => {
    if (isNew || isDraft) {
      navigate(`/admin/properties/list?filter=${activeFilter}`);
    } else {
      navigate(`/admin/properties/${propertyId}`, { state: { returnFilter: activeFilter } });
    }
  };

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    location: '',
    price: '',
    type: 'New Listing',
    description: '',
    website: '',
    map: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>(['', '', '']);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brochureUrl, setBrochureUrl] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const { data: propertyResponse, isLoading } = useQuery({
    queryKey: ['admin-property', id],
    queryFn: async () => {
      const response = await adminAPI.getPropertyById(token!, id!);
      return response.data;
    },
    enabled: !!token && !!id && id !== 'new' && !isNew && !initialDraftData && !skipLoading,
    staleTime: 30000,
  });

  const property = propertyResponse?.data || propertyResponse;

  useEffect(() => {
    const data = initialDraftData || property;
    if (data) {
      setFormData({
        title: data.title || '',
        location: data.location || '',
        price: data.price?.toString() || '',
        type: data.type || 'New Listing',
        description: data.description || '',
        website: data.website || '',
        map: data.map || '',
      });
      setImages(data.images || []);
      setGallery(data.gallery || []);
      setFeatures(data.features || ['', '', '']);
      setAmenities(data.amenities || []);
      setCategories(data.categories || []);
      setBrochureUrl(data.brochureUrl || '');
    }
  }, [property, initialDraftData]);

  const createMutation = useMutation({
    mutationFn: (data: any) => adminAPI.createProperty(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Property created successfully');
      navigate(`/admin/properties/list?filter=approved`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create property');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updateProperty(token!, propertyId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Property updated successfully');
      navigate(`/admin/properties/list?filter=approved`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update property');
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isDraft && changeId) {
        return adminAPI.updateDraft(token!, changeId, data);
      }
      return adminAPI.createPropertyDraft(token!, propertyId || undefined, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      toast.success('Draft saved successfully');
      navigate(`/admin/properties/list?filter=draft`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    },
  });

  const submitDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isDraft && changeId) {
        await adminAPI.updateDraft(token!, changeId, data);
        return adminAPI.submitDraft(token!, changeId);
      }
      return adminAPI.createProperty(token!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      toast.success(isDraft ? 'Draft submitted successfully' : 'Property created successfully');
      navigate(`/admin/properties/list?filter=approved`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit');
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileName = `property-${Date.now()}.jpg`;
        const { data } = await uploadAPI.getSignedUrl(token!, fileName, 'image/jpeg', 'property_image', file.size);
        await uploadAPI.uploadToR2(data.uploadUrl, file, 'image/jpeg');
        uploadedUrls.push(data.publicUrl);
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Failed to upload image');
      }
    }

    if (isGallery) {
      setGallery([...gallery, ...uploadedUrls]);
    } else {
      setImages([...images, ...uploadedUrls]);
    }
    setUploading(false);
  };

  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBrochure(true);
    try {
      const { data } = await uploadAPI.getSignedUrl(token!, file.name, 'application/pdf', 'brochure', file.size);
      await uploadAPI.uploadToR2(data.uploadUrl, file, 'application/pdf');
      setBrochureUrl(data.publicUrl);
      toast.success('Brochure uploaded');
    } catch (error) {
      console.error('Brochure upload error:', error);
      toast.error('Failed to upload brochure');
    }
    setUploadingBrochure(false);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.location) {
      toast.error('Title and location are required');
      return;
    }

    const filteredFeatures = features.filter(f => f && f.trim());
    const data = {
      ...formData,
      price: formData.price && formData.price.trim() ? formData.price : null,
      images,
      gallery,
      amenities,
      features: filteredFeatures,
      categories,
      brochureUrl: brochureUrl || undefined,
    };

    if (isDraft) {
      submitDraftMutation.mutate(data);
    } else if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleSaveDraft = () => {
    if (!formData.title || !formData.location) {
      toast.error('Title and location are required');
      return;
    }

    const filteredFeatures = features.filter(f => f && f.trim());
    const data = {
      ...formData,
      price: formData.price && formData.price.trim() ? formData.price : null,
      images,
      gallery,
      amenities,
      features: filteredFeatures,
      categories,
      brochureUrl: brochureUrl || undefined,
    };

    saveDraftMutation.mutate(data);
  };

  const handleDiscard = async () => {
    if (!isDraft || !changeId) return;
    setIsDiscarding(true);
    try {
      await adminAPI.discardDraft(token!, changeId);
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      toast.success('Draft discarded');
      navigate(`/admin/properties/list?filter=draft`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to discard draft');
    } finally {
      setIsDiscarding(false);
    }
  };

  if (isLoading && !isNew && !initialDraftData && !skipLoading) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate(`/admin/properties/list?filter=${activeFilter}`)}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Edit Property</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="px-4 pt-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">{isNew ? 'Create' : 'Edit'} Property</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 pt-4 pb-8 max-w-4xl mx-auto">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Basic Information</h3>
          
          <label className="block text-sm font-medium text-muted-foreground mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Enter property title"
          />

          <label className="block text-sm font-medium text-muted-foreground mb-2">Location *</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Enter location"
          />

          <label className="block text-sm font-medium text-muted-foreground mb-2">Price</label>
          <input
            type="text"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Enter price (optional)"
          />

          <label className="block text-sm font-medium text-muted-foreground mb-2">Type</label>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['New Listing', 'On Resale', 'Ready to Move'].map((type) => (
              <button
                key={type}
                onClick={() => setFormData({ ...formData, type })}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                  formData.type === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-accent'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="Enter description"
          />
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Thumbnail Images</h3>
            <label className="cursor-pointer">
              <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" disabled={uploading} />
              <div className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
            </label>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Features</h3>
          {['Apartment Type', 'Plot Size', 'Property Status'].map((label, idx) => (
            <div key={idx} className="mb-4 last:mb-0">
              <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>
              <input
                type="text"
                value={features[idx] || ''}
                onChange={(e) => {
                  const newFeatures = [...features];
                  newFeatures[idx] = e.target.value;
                  setFeatures(newFeatures);
                }}
                className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder={`e.g., ${idx === 0 ? '3 BHK' : idx === 1 ? '2500 Sq.Ft' : 'Ongoing, Completed'}`}
              />
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Amenities</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              className="flex-1 px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Add amenity"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newAmenity.trim()) {
                  setAmenities([...amenities, newAmenity.trim()]);
                  setNewAmenity('');
                }
              }}
            />
            <button
              onClick={() => {
                if (newAmenity.trim()) {
                  setAmenities([...amenities, newAmenity.trim()]);
                  setNewAmenity('');
                }
              }}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <span className="text-xs sm:text-sm text-foreground">{item}</span>
                  <button onClick={() => setAmenities(amenities.filter((_, i) => i !== idx))} className="hover:opacity-70 transition-opacity">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Categories</h3>
            <button
              onClick={() => setShowCategoryInput(!showCategoryInput)}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {showCategoryInput && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Add custom category"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newCategory.trim() && !categories.includes(newCategory.trim())) {
                    setCategories([...categories, newCategory.trim()]);
                    setNewCategory('');
                    setShowCategoryInput(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                    setCategories([...categories, newCategory.trim()]);
                    setNewCategory('');
                    setShowCategoryInput(false);
                  }
                }}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity active:scale-95"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  if (categories.includes(cat)) {
                    setCategories(categories.filter(c => c !== cat));
                  } else {
                    setCategories([...categories, cat]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                  categories.includes(cat)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-accent'
                }`}
              >
                {categories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}
                {cat}
              </button>
            ))}
          </div>

          {categories.filter(c => !DEFAULT_CATEGORIES.includes(c)).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Custom Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => !DEFAULT_CATEGORIES.includes(c)).map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg">
                    <span className="text-xs sm:text-sm">{cat}</span>
                    <button onClick={() => setCategories(categories.filter(c => c !== cat))}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Gallery Images</h3>
            <label className="cursor-pointer">
              <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" disabled={uploading} />
              <div className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
            </label>
          </div>
          {gallery.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {gallery.map((url, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => setGallery(gallery.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Links</h3>
          
          <label className="block text-sm font-medium text-muted-foreground mb-2">Google Maps URL</label>
          <input
            type="text"
            value={formData.map}
            onChange={(e) => setFormData({ ...formData, map: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="https://maps.app.goo.gl/..."
          />

          <label className="block text-sm font-medium text-muted-foreground mb-2">Website URL</label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-3 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="https://..."
          />
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Brochure</h3>
            <label className="cursor-pointer">
              <input type="file" accept="application/pdf" onChange={handleBrochureUpload} className="hidden" />
              <div className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
                {uploadingBrochure ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
            </label>
          </div>
          {brochureUrl && (
            <p className="text-sm text-muted-foreground">✓ Brochure uploaded</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isDraft && changeId && (
            <button
              onClick={handleDiscard}
              disabled={isDiscarding || saveDraftMutation.isPending || submitDraftMutation.isPending || createMutation.isPending || updateMutation.isPending || uploading}
              className="flex-1 px-4 py-2.5 sm:py-3 bg-destructive text-destructive-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              {isDiscarding && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
              {isDiscarding ? 'Discarding...' : 'Discard'}
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending || submitDraftMutation.isPending || createMutation.isPending || updateMutation.isPending || uploading || isDiscarding}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-secondary text-secondary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {saveDraftMutation.isPending && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
            {saveDraftMutation.isPending ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || submitDraftMutation.isPending || saveDraftMutation.isPending || uploading || isDiscarding}
            className="flex-1 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {(createMutation.isPending || updateMutation.isPending || submitDraftMutation.isPending) && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />}
            {createMutation.isPending || updateMutation.isPending || submitDraftMutation.isPending ? (isDraft ? 'Submitting...' : isNew ? 'Creating...' : 'Updating...') : (isDraft ? 'Create Property' : isNew ? 'Create Property' : 'Update Property')}
          </button>
        </div>
      </div>
    </div>
  );
};
