import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Tag, 
  Shield, 
  CheckCircle2,
  Clock,
  Edit3,
  X,
  Save,
  Upload,
  Loader2,
  CalendarIcon,
  Check,
  AlertCircle,
  Users,
  ChevronRight,
  RefreshCw,
  Briefcase,
  MessageSquare,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { userAPI, uploadAPI, adminAPI, employeeAPI } from '@/utils/api';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  city: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ReferredCustomer {
  id: number;
  name: string | null;
  email: string | null;
  phone: string;
  city: string | null;
  dateOfBirth: string | null;
  profileImgUrl: string | null;
  profileCompleted: boolean;
  active: boolean;
  approved: boolean;
  preferredCategories: string[] | null;
  createdAt: string;
  lastLogin: string | null;
}

interface UserProfile {
  id: number;
  phone: string;
  name: string | null;
  email: string | null;
  city: string | null;
  dateOfBirth: string | null;
  profileImgUrl: string | null;
  profileCompleted: boolean;
  role: string;
  active: boolean;
  approved: boolean;
  preferredCategories: string[] | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  assignedEmployeeId: number | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  rejectedAt: string | null;
  referredByAgentId: number | null;
  department: string | null;
}

export const ProfilePage: React.FC = () => {
  const { user, token, updateUser, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state to mirror user data for immediate display updates
  const [displayUser, setDisplayUser] = useState<UserProfile | null>(user ? {
    id: user.id,
    phone: user.phone,
    name: user.name || null,
    email: user.email || null,
    city: user.city || null,
    profileImgUrl: user.profileImgUrl || null,
    dateOfBirth: user.dateOfBirth || null,
    preferredCategories: user.preferredCategories || null,
    profileCompleted: user.profileCompleted,
    role: user.role || 'customer',
    active: user.active ?? true,
    approved: user.approved ?? false,
    createdAt: (user as any).createdAt || new Date().toISOString(),
    updatedAt: (user as any).updatedAt || new Date().toISOString(),
    lastLogin: (user as any).lastLogin || null,
    assignedEmployeeId: (user as any).assignedEmployeeId || null,
    approvedAt: (user as any).approvedAt || null,
    rejectedReason: (user as any).rejectedReason || null,
    rejectedAt: (user as any).rejectedAt || null,
    referredByAgentId: (user as any).referredByAgentId || null,
    department: user.department || null,
  } : null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImgUrl || null);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(user?.preferredCategories || []);
  const [updateKey, setUpdateKey] = useState(0); // Force re-render key
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Sync displayUser whenever user changes from store (but only if not editing and not just after a save)
  // This ensures we don't overwrite manual updates during save
  // We use a ref to track if we just updated from onSuccess to prevent this effect from overwriting
  const justUpdatedRef = useRef(false);
  
  useEffect(() => {
    if (user && !isEditing && !justUpdatedRef.current) {
      setDisplayUser(prev => {
        // Only update if data actually changed to prevent unnecessary re-renders
        if (!prev || prev.id !== user.id || 
            prev.name !== user.name || 
            prev.email !== user.email || 
            prev.city !== user.city ||
            prev.profileImgUrl !== user.profileImgUrl ||
            prev.dateOfBirth !== user.dateOfBirth) {
          const userProfile: UserProfile = {
            id: user.id,
            phone: user.phone,
            name: user.name || null,
            email: user.email || null,
            city: user.city || null,
            profileImgUrl: user.profileImgUrl || null,
            dateOfBirth: user.dateOfBirth || null,
            preferredCategories: user.preferredCategories || null,
            profileCompleted: user.profileCompleted,
            role: user.role || 'customer',
            active: user.active ?? true,
            approved: user.approved ?? false,
            createdAt: (user as any).createdAt || new Date().toISOString(),
            updatedAt: (user as any).updatedAt || new Date().toISOString(),
            lastLogin: (user as any).lastLogin || null,
            assignedEmployeeId: (user as any).assignedEmployeeId || null,
            approvedAt: (user as any).approvedAt || null,
            rejectedReason: (user as any).rejectedReason || null,
            rejectedAt: (user as any).rejectedAt || null,
            referredByAgentId: (user as any).referredByAgentId || null,
            department: user.department || null,
          };
          return userProfile;
        }
        return prev; // Keep current displayUser if no significant changes
      });
    }
    // Reset the flag after a short delay to allow normal syncing again
    if (justUpdatedRef.current) {
      const timer = setTimeout(() => {
        justUpdatedRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isEditing]);

  // Sync selectedCategories when user data changes
  useEffect(() => {
    if (displayUser?.preferredCategories) {
      setSelectedCategories(displayUser.preferredCategories);
    }
  }, [displayUser?.preferredCategories]);

  // Sync profileImage when user data changes
  useEffect(() => {
    if (displayUser?.profileImgUrl) {
      setProfileImage(displayUser.profileImgUrl);
    } else if (displayUser && !displayUser.profileImgUrl) {
      setProfileImage(null);
    }
  }, [displayUser?.profileImgUrl]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: displayUser?.name || '',
      email: displayUser?.email || '',
      city: displayUser?.city || '',
      dateOfBirth: displayUser?.dateOfBirth ? format(new Date(displayUser.dateOfBirth), 'yyyy-MM-dd') : '',
    },
  });

  // Fetch categories for editing
  const { data: profileData, isLoading: profileLoading, isError: profileError, error: profileErrorData, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const userRole = user?.role?.toLowerCase();
      if (userRole === 'admin') return adminAPI.getProfile(token!);
      if (userRole === 'employee') return { data: user };
      return userAPI.getProfile(token!);
    },
    enabled: !!token && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    initialData: user?.role?.toLowerCase() === 'employee' ? { data: user } : undefined,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['property-categories'],
    queryFn: () => userAPI.getCategories(token!),
    enabled: !!token && isEditing && user?.role?.toLowerCase() === 'customer',
  });

  const categories = categoriesData?.data?.categories || [];

  // Fetch referred customers for agents
  const { data: referredCustomersData, isLoading: referredCustomersLoading } = useQuery({
    queryKey: ['referred-customers'],
    queryFn: () => userAPI.getReferredCustomers(token!),
    enabled: !!token && user?.role?.toLowerCase() === 'agent',
  });

  const referredCustomers: ReferredCustomer[] = referredCustomersData?.data?.data || [];

  // Reset form when entering edit mode
  useEffect(() => {
    if (displayUser && isEditing) {
      form.reset({
        name: displayUser.name || '',
        email: displayUser.email || '',
        city: displayUser.city || '',
        dateOfBirth: displayUser.dateOfBirth ? format(new Date(displayUser.dateOfBirth), 'yyyy-MM-dd') : '',
      });
      setProfileImage(displayUser.profileImgUrl || null);
      // Always sync categories from user data when entering edit mode
      if (displayUser.preferredCategories && Array.isArray(displayUser.preferredCategories)) {
        setSelectedCategories(displayUser.preferredCategories);
      } else {
        setSelectedCategories([]);
      }
    }
  }, [isEditing, displayUser]); // Reset when isEditing changes or when displayUser changes

  const uploadImage = async (file: File) => {
    if (imageUploading || !token) {
      if (!token) toast.error('Authentication required to upload image');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    
    try {
      setImageUploading(true);
      const fileName = `profile-${Date.now()}.jpg`;
      if (file.size > 10 * 1024 * 1024) throw new Error('Image is too large. Maximum size is 10MB');
      
      const { data } = await uploadAPI.getSignedUrl(token, fileName, file.type, 'profile', file.size);
      await uploadAPI.uploadToR2(data.uploadUrl, file, file.type);
      setProfileImage(data.publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Image upload error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload image';
      toast.error(errorMessage);
      setProfileImage(displayUser?.profileImgUrl || null);
    } finally {
      setImageUploading(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      const userRole = user?.role?.toLowerCase();
      const isAdmin = userRole === 'admin';
      const isEmployee = userRole === 'employee';
      
      // Use appropriate API based on role
      if (isAdmin) {
        // Admin profile update
        const updateData: any = {
          ...data,
        };
        // Only include profileImgUrl if it exists
        if (profileImage) {
          updateData.profileImgUrl = profileImage;
        }
        return adminAPI.updateProfile(token!, updateData);
      } else if (isEmployee) {
        // Employee profile update - doesn't require city or role
        const updateData: any = {
          name: data.name,
          email: data.email,
        };
        // Only include profileImgUrl if it exists (employee endpoint validates URL format)
        if (profileImage) {
          updateData.profileImgUrl = profileImage;
        }
        if (data.dateOfBirth) {
          // Employee endpoint expects ISO datetime string
          updateData.dateOfBirth = new Date(data.dateOfBirth).toISOString();
        }
        return employeeAPI.updateProfile(token!, updateData);
      } else {
        // Customer/Agent profile update - requires capitalized role
        const updateData: any = {
          ...data,
          profileImgUrl: profileImage,
          role: userRole === 'agent' ? 'Agent' : 'Customer', // Capitalize for backend validation
          preferredCategories: selectedCategories,
        };
        return userAPI.updateProfile(token!, updateData);
      }
    },
    onSuccess: async (response) => {
      try {
        // Handle different response structures for different roles
        const updatedUser = response.data?.user || response.data?.data?.user || response.data;
        
        if (!updatedUser) {
          toast.error('Invalid response from server');
          return;
        }
        
        const userRole = user?.role?.toLowerCase();
        
        // Ensure all required fields are present and properly formatted for all roles
        const formattedUser = {
          ...user, // Preserve existing user data
          ...updatedUser, // Override with updated data
          id: updatedUser.id || user?.id || 0,
          phone: updatedUser.phone || user?.phone || '',
          name: updatedUser.name || user?.name || '',
          email: updatedUser.email || user?.email || '',
          // City might not be present for employees/admins
          city: updatedUser.city !== undefined ? updatedUser.city : (user?.city || ''),
          role: updatedUser.role || user?.role || 'customer',
          profileImgUrl: updatedUser.profileImgUrl !== undefined ? updatedUser.profileImgUrl : (user?.profileImgUrl || null),
          dateOfBirth: updatedUser.dateOfBirth 
            ? (typeof updatedUser.dateOfBirth === 'string' 
                ? updatedUser.dateOfBirth 
                : new Date(updatedUser.dateOfBirth).toISOString())
            : (user?.dateOfBirth || undefined),
          // preferredCategories only for customers/agents
          preferredCategories: updatedUser.preferredCategories !== undefined 
            ? updatedUser.preferredCategories 
            : (user?.preferredCategories || []),
          profileCompleted: updatedUser.profileCompleted !== undefined 
            ? updatedUser.profileCompleted 
            : (user?.profileCompleted ?? false),
          active: updatedUser.active !== undefined ? updatedUser.active : (user?.active ?? true),
          approved: updatedUser.approved !== undefined ? updatedUser.approved : (user?.approved ?? false),
          // Preserve role-specific fields
          department: updatedUser.department !== undefined ? updatedUser.department : (user?.department || undefined),
        };
        
        // Update display state IMMEDIATELY to show updated information right away
        // Create a new UserProfile object with all required fields to force React re-render for all banners
        const updatedDisplayUser: UserProfile = {
          id: formattedUser.id,
          phone: formattedUser.phone,
          name: formattedUser.name || null,
          email: formattedUser.email || null,
          city: formattedUser.city || null,
          profileImgUrl: formattedUser.profileImgUrl || null,
          dateOfBirth: formattedUser.dateOfBirth || null,
          preferredCategories: formattedUser.preferredCategories || null,
          profileCompleted: formattedUser.profileCompleted,
          role: formattedUser.role || 'customer',
          active: formattedUser.active ?? true,
          approved: formattedUser.approved ?? false,
          createdAt: updatedUser.createdAt || (user as any).createdAt || new Date().toISOString(),
          updatedAt: updatedUser.updatedAt || (user as any).updatedAt || new Date().toISOString(),
          lastLogin: updatedUser.lastLogin || (user as any).lastLogin || null,
          assignedEmployeeId: updatedUser.assignedEmployeeId || (user as any).assignedEmployeeId || null,
          approvedAt: updatedUser.approvedAt || (user as any).approvedAt || null,
          rejectedReason: updatedUser.rejectedReason || (user as any).rejectedReason || null,
          rejectedAt: updatedUser.rejectedAt || (user as any).rejectedAt || null,
          referredByAgentId: updatedUser.referredByAgentId || (user as any).referredByAgentId || null,
          department: formattedUser.department || null,
        };
        
        // Set flag to prevent useEffect from overwriting our update
        justUpdatedRef.current = true;
        
        // Update all state synchronously for immediate display
        setDisplayUser(updatedDisplayUser);
        setProfileImage(formattedUser.profileImgUrl || null);
        
        // Only update selectedCategories for customers/agents
        if (userRole === 'customer' || userRole === 'agent') {
          setSelectedCategories(formattedUser.preferredCategories || []);
        }
        
        // Update the store with formatted user data
        updateUser(formattedUser);
        
        // Reset form with updated values
        form.reset({
          name: formattedUser.name || '',
          email: formattedUser.email || '',
          city: formattedUser.city || '',
          dateOfBirth: formattedUser.dateOfBirth 
            ? format(new Date(formattedUser.dateOfBirth), 'yyyy-MM-dd') 
            : '',
        });
        
        // Force re-render by updating key
        setUpdateKey(prev => prev + 1);
        
        // Exit edit mode immediately to show updated profile
        setIsEditing(false);
        
        // Invalidate and refetch referred customers if user is an agent (async, won't block UI)
        if (userRole === 'agent') {
          queryClient.invalidateQueries({ queryKey: ['referred-customers'] });
        }
        
        toast.success('Profile updated successfully!');
      } catch (error) {
        console.error('Error processing update response:', error);
        toast.error('Failed to process update response');
      }
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update profile';
      toast.error(errorMessage);
      
      if (displayUser) {
        form.reset({
          name: displayUser.name || '',
          email: displayUser.email || '',
          city: displayUser.city || '',
          dateOfBirth: displayUser.dateOfBirth ? format(new Date(displayUser.dateOfBirth), 'yyyy-MM-dd') : '',
        });
        setProfileImage(displayUser.profileImgUrl || null);
        setSelectedCategories(displayUser.preferredCategories || []);
      }
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    // Only validate categories for customers (not for admin or other roles)
    if (displayUser?.role?.toLowerCase() === 'customer' && selectedCategories.length === 0) {
      toast.error('Please select at least one preferred category');
      return;
    }
    updateProfileMutation.mutate(data);
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      // Remove category
      setSelectedCategories((prev) => prev.filter((c) => c !== category));
    } else {
      // Add category - check for duplicates (shouldn't happen, but safeguard)
      if (selectedCategories.includes(category)) {
        toast.warning(`${category} is already selected`);
        return;
      }
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const cancelEdit = () => {
    form.reset({
      name: displayUser?.name || '',
      email: displayUser?.email || '',
      city: displayUser?.city || '',
      dateOfBirth: displayUser?.dateOfBirth ? format(new Date(displayUser.dateOfBirth), 'yyyy-MM-dd') : '',
    });
    setProfileImage(displayUser?.profileImgUrl || null);
    setSelectedCategories(displayUser?.preferredCategories || []);
    setIsEditing(false);
  };

  const deleteAccountMutation = useMutation({
    mutationFn: () => userAPI.deleteAccount(token!),
    onSuccess: () => {
      toast.success('Account deleted successfully');
      updateUser({ ...user!, deleted: true });
      clearAuth();
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete account');
    },
  });

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
    setShowDeleteModal(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy');
    } catch {
      return 'Not provided';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SkeletonLoader = () => {
    const userRole = user?.role?.toLowerCase();
    const isEmployee = userRole === 'employee';
    const isAdmin = userRole === 'admin';
    const isAgent = userRole === 'agent';
    const contactFieldsCount = isEmployee ? 5 : isAdmin ? 4 : isAgent ? 4 : 5;
    
    return (
      <div className="min-h-screen pb-8">
        {/* Header - matching employee pages */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
          <button
            onClick={() => navigate(user?.role?.toLowerCase() === 'employee' ? '/employee/home' : user?.role?.toLowerCase() === 'admin' ? '/admin/home' : '/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Profile</h1>
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-pulse">
          {/* Profile Header Skeleton */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-muted/30" />
              <div className="text-center sm:text-left flex-1 space-y-2 sm:space-y-3">
                <Skeleton className="h-6 sm:h-8 w-32 sm:w-48 bg-muted/30 rounded mx-auto sm:mx-0" />
                <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start">
                  <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 bg-muted/30 rounded-full" />
                  {!isEmployee && !isAdmin && <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 bg-muted/30 rounded-full" />}
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Grid Skeleton */}
          <div className={`grid grid-cols-1 gap-6 ${
            isEmployee || isAdmin ? '' : 'md:grid-cols-2'
          }`}>
            {/* Contact Information Skeleton */}
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 rounded mb-3 sm:mb-4" />
              <div className="space-y-2.5 sm:space-y-3">
                {Array.from({ length: contactFieldsCount }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                    <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0">
                      <Skeleton className="h-2 sm:h-2.5 w-10 sm:w-12 rounded" />
                      <Skeleton className="h-3 sm:h-3.5 w-20 sm:w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Account Status Skeleton */}
            {!isEmployee && !isAdmin && (
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 rounded mb-4" />
                <div className="space-y-3 sm:space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/50 rounded-xl">
                      <Skeleton className="h-3.5 sm:h-4 w-20 sm:w-24 rounded" />
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Card Skeleton */}
            {(isAgent || isEmployee) && (
              <div className={`bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm ${
                isEmployee || isAdmin ? '' : 'md:col-span-2'
              }`}>
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-48 rounded" />
                  </div>
                  <Skeleton className="w-5 h-5 rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Referred Customers Skeleton */}
          {isAgent && (
            <div className="mt-6 bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
              <Skeleton className="h-5 w-40 rounded mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border-b border-border/50 last:border-0">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-48 rounded" />
                    </div>
                    <Skeleton className="w-5 h-5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ErrorState = () => (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
        <button
          onClick={() => navigate(user?.role?.toLowerCase() === 'employee' ? '/employee/home' : user?.role?.toLowerCase() === 'admin' ? '/admin/home' : '/home')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Profile</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="max-w-sm sm:max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Failed to Load Profile</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
              {(profileErrorData as any)?.response?.data?.message || 'Unable to fetch your profile. Please check your connection and try again.'}
            </p>
            <button
              onClick={() => refetchProfile()}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all mx-auto shadow-md hover:shadow-lg active:scale-95 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Show skeleton only when actually loading from API (not for cached employee data)
  const shouldShowSkeleton = profileLoading && !(user?.role?.toLowerCase() === 'employee' && user);
  
  if (shouldShowSkeleton) return <SkeletonLoader />;
  if (profileError) return <ErrorState />;
  
  if (!displayUser) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
          <button
            onClick={() => navigate(user?.role?.toLowerCase() === 'employee' ? '/employee/home' : user?.role?.toLowerCase() === 'admin' ? '/admin/home' : '/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Profile</h1>
          <div className="w-9 sm:w-10" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="max-w-sm sm:max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 text-center">
              <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Profile Data</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                Your profile information is not available. Please try refreshing the page or contact support if the issue persists.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all mx-auto shadow-md hover:shadow-lg active:scale-95 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Page</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
        <button
          onClick={() => navigate(displayUser?.role?.toLowerCase() === 'employee' ? '/employee/home' : displayUser?.role?.toLowerCase() === 'admin' ? '/admin/home' : '/home')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Profile</h1>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors active:scale-95"
              aria-label="Edit Profile"
            >
              <Edit3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : (
            <button
              onClick={cancelEdit}
              className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/70 transition-colors active:scale-95"
              aria-label="Cancel"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 sm:px-6"
      >

      {/* Profile Header Card */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 mb-4 sm:mb-6"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {/* Profile Image */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative"
          >
            {profileImage ? (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                <img
                  src={profileImage}
                  alt={displayUser?.name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-white/20 shadow-2xl">
                <span className="text-4xl sm:text-5xl font-bold text-white">
                  {getInitials(displayUser?.name || undefined)}
                </span>
              </div>
            )}
            
            {/* Edit image button */}
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="absolute bottom-1 right-1 p-2.5 bg-orange-500 text-white rounded-full ring-4 ring-slate-900 hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {imageUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
              className="hidden"
            />
            
            {/* Status badge */}
            {!isEditing && (
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full ring-4 ring-slate-900">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            )}
          </motion.div>

          {/* Name and basic info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {displayUser?.name || 'User'}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-sm capitalize">
                <Shield className="w-4 h-4" />
                {displayUser?.role || 'Customer'}
              </span>
              {displayUser?.city && displayUser?.role?.toLowerCase() !== 'employee' && displayUser?.role?.toLowerCase() !== 'admin' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-sm">
                  <MapPin className="w-4 h-4" />
                  {displayUser.city}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {isEditing ? (
        /* Edit Form */
        <motion.div
          key="edit-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6 shadow-sm"
        >
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Edit3 className="w-5 h-5 text-primary" />
              </div>
              Edit Profile Information
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              {...field}
                              placeholder="John Doe"
                              className="w-full h-11 pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              {...field}
                              type="email"
                              placeholder="john@example.com"
                              className="w-full h-11 pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {displayUser?.role?.toLowerCase() !== 'employee' && displayUser?.role?.toLowerCase() !== 'admin' && (
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                {...field}
                                placeholder="New York"
                                className="w-full h-11 pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => {
                      const [calendarOpen, setCalendarOpen] = useState(false);
                      return (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <button
                                  type="button"
                                  className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2.5 bg-background border border-input rounded-xl text-left text-sm h-11 focus:outline-none focus:ring-2 focus:ring-ring',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  <CalendarIcon className="w-4 h-4" />
                                  {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                                </button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                  setCalendarOpen(false);
                                }}
                                disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Preferred Categories (only for customers) */}
                {displayUser?.role?.toLowerCase() === 'customer' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Preferred Property Types <span className="text-red-500">*</span>
                    </label>
                    {categoriesLoading ? (
                      <div className="flex items-center gap-2 p-3 border rounded-xl">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading categories...</span>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 border rounded-xl bg-muted/50">
                        <AlertCircle size={16} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">No categories available</span>
                      </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2.5 bg-background border rounded-xl text-left text-sm h-11 transition-colors',
                              selectedCategories.length > 0 
                                ? 'border-primary/30 bg-primary/5 text-foreground' 
                                : 'border-input text-muted-foreground'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Tag className={cn(
                                'w-4 h-4',
                                selectedCategories.length > 0 ? 'text-primary' : 'text-muted-foreground'
                              )} />
                              <span>
                                {selectedCategories.length > 0 
                                  ? `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'} selected` 
                                  : 'Select categories'}
                              </span>
                            </div>
                            {selectedCategories.length > 0 && (
                              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                                {selectedCategories.length}
                              </span>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <div className="max-h-[200px] overflow-y-auto p-2">
                            {categories.map((category: string) => {
                              const isSelected = selectedCategories.includes(category);
                              return (
                                <button
                                  key={category}
                                  type="button"
                                  onClick={() => toggleCategory(category)}
                                  className={cn(
                                    'w-full flex items-center justify-between p-2.5 rounded-lg transition-colors',
                                    isSelected 
                                      ? 'bg-primary/10 hover:bg-primary/15 border border-primary/20' 
                                      : 'hover:bg-muted'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{category}</span>
                                    {isSelected && (
                                      <span className="text-xs text-primary font-medium">(Selected)</span>
                                    )}
                                  </div>
                                  {isSelected && <Check size={16} className="text-primary flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          {selectedCategories.length > 0 && (
                            <div className="p-2 border-t bg-muted/30">
                              <p className="text-xs text-muted-foreground text-center">
                                {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
                              </p>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    )}
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedCategories.map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm flex items-center gap-1.5 font-medium"
                          >
                            {cat}
                            <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-primary/70">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md transition-all duration-200 ease-out hover:bg-primary/85 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-md"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Form>
        </motion.div>
      ) : (
        /* View Mode */
        <div>
            {/* Profile Details Grid */}
            <div className={`grid grid-cols-1 gap-6 ${
              displayUser?.role?.toLowerCase() === 'employee' || displayUser?.role?.toLowerCase() === 'admin' ? '' : 'md:grid-cols-2'
            }`}>
              {/* Contact Information */}
              <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  </div>
                  Contact Information
                </h2>
                
                <div className="space-y-3 sm:space-y-4">
                  {displayUser?.department && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Department</p>
                        <p className="text-sm sm:text-base text-foreground font-medium truncate">
                          {displayUser.department || <span className="text-muted-foreground italic">Not assigned</span>}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                      <p className="text-sm sm:text-base text-foreground font-medium truncate">
                        {displayUser?.phone || <span className="text-muted-foreground italic">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-sm sm:text-base text-foreground font-medium break-all">
                        {displayUser?.email || <span className="text-muted-foreground italic">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Date of Birth</p>
                      <p className="text-sm sm:text-base text-foreground font-medium">
                        {displayUser?.dateOfBirth ? formatDate(displayUser.dateOfBirth) : <span className="text-muted-foreground italic">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  {/* Last Login - Only for Employee and Admin */}
                  {(displayUser?.role?.toLowerCase() === 'employee' || displayUser?.role?.toLowerCase() === 'admin') && displayUser?.lastLogin && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Login</p>
                        <p className="text-sm sm:text-base text-foreground font-medium">
                          {formatDate(displayUser.lastLogin)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Status - Only for non-employees and non-admins */}
              {displayUser?.role?.toLowerCase() !== 'employee' && displayUser?.role?.toLowerCase() !== 'admin' && (
                <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    </div>
                    Account Status
                  </h2>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">Profile Status</span>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                        displayUser?.profileCompleted 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {displayUser?.profileCompleted ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">Account Active</span>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                        displayUser?.active 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {displayUser?.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">Approval Status</span>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                        displayUser?.approved 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {displayUser?.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat with Admin - Only for Agent and Employee */}
              {(displayUser?.role?.toLowerCase() === 'agent' || displayUser?.role?.toLowerCase() === 'employee') && (
                <div 
                  className={`bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    displayUser?.role?.toLowerCase() === 'employee' || displayUser?.role?.toLowerCase() === 'admin' ? '' : 'md:col-span-2'
                  }`}
                  onClick={() => navigate('/chat')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <MessageSquare className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-1">Chat with Admin</h3>
                      <p className="text-sm text-muted-foreground">Get instant support and assistance</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Referred Customers - Only for Agents */}
              {displayUser?.role?.toLowerCase() === 'agent' && referredCustomers.length > 0 && (
                <motion.div variants={itemVariants} className="md:col-span-2 bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    </div>
                    Referred Customers ({referredCustomers.length})
                  </h2>
                  
                  {referredCustomersLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border-b border-border/50 last:border-0">
                          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 rounded" />
                            <Skeleton className="h-3 w-48 rounded" />
                          </div>
                          <Skeleton className="w-5 h-5 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {referredCustomers.map((customer, index) => (
                        <motion.button
                          key={customer.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => navigate(`/customer/${customer.id}`)}
                          className="w-full flex items-center gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
                        >
                          {customer.profileImgUrl ? (
                            <img
                              src={customer.profileImgUrl}
                              alt={customer.name || 'Customer'}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${customer.profileImgUrl ? 'hidden' : ''}`}>
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                              {customer.name || 'No Name'}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {customer.email || customer.phone}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Preferred Categories */}
              {displayUser?.role?.toLowerCase() === 'customer' && displayUser?.preferredCategories && displayUser.preferredCategories.length > 0 && (
                <div key={`categories-${updateKey}`} className="md:col-span-2 bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Tag className="w-5 h-5 text-purple-500" />
                    </div>
                    Preferred Property Categories
                  </h2>
                  
                  <div className="flex flex-wrap gap-2">
                    {displayUser.preferredCategories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-foreground rounded-xl text-sm font-medium border border-purple-500/20"
                      >
                        <Tag className="w-3.5 h-3.5 text-purple-500" />
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>


        </div>
      )}

        {/* Delete Account Button - Always visible for Agent and Customer */}
        {(displayUser?.role?.toLowerCase() === 'agent' || displayUser?.role?.toLowerCase() === 'customer') && (
          <motion.div variants={itemVariants} className="mt-6">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteAccountMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-destructive text-destructive-foreground rounded-xl font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              {deleteAccountMutation.isPending ? 'Deleting Account...' : 'Delete Account'}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Delete Account</h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this account permanently? This action cannot be undone!
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteAccountMutation.isPending}
                className="px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="px-4 py-2 rounded-lg font-medium text-white bg-destructive hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
