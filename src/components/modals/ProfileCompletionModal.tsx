import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { User, Mail, MapPin, CalendarIcon, Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { userAPI, uploadAPI } from '../../utils/api';
import type { Agent } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  city: z.string().min(2, 'City is required'),
  role: z.enum(['Customer', 'Agent']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  preferredCategories: z.array(z.string()).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onClose, onComplete }) => {
  const { token, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedRole, setSelectedRole] = useState('Customer');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [referredByAgent, setReferredByAgent] = useState<Agent | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { role: 'Customer', name: '', email: '', city: '', dateOfBirth: '', preferredCategories: [] },
  });

  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['property-categories'],
    queryFn: () => userAPI.getCategories(token!),
    enabled: !!token && isOpen && selectedRole === 'Customer',
  });

  const { data: agentsData, isLoading: agentsLoading, error: agentsError } = useQuery({
    queryKey: ['approved-agents'],
    queryFn: () => userAPI.getApprovedAgents(token!),
    enabled: !!token && isOpen && selectedRole === 'Customer',
  });

  const categories = categoriesData?.data?.categories || [];
  const agents = agentsData?.data?.agents || [];

  const uploadImage = async (file: File) => {
    if (imageUploading) return;
    try {
      setImageUploading(true);
      const fileName = `profile-${Date.now()}.jpg`;
      if (file.size > 10 * 1024 * 1024) throw new Error('Image is too large. Maximum size is 10MB');
      const { data } = await uploadAPI.getSignedUrl(token!, fileName, file.type, 'profile', file.size);
      await uploadAPI.uploadToR2(data.uploadUrl, file, file.type);
      setProfileImage(data.publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) =>
      userAPI.updateProfile(token!, {
        ...data,
        profileImgUrl: profileImage,
        profileCompleted: true,
        preferredCategories: selectedCategories,
        referredByAgentId: referredByAgent?.id,
      }),
    onSuccess: (response) => {
      const updatedUser = response.data.user;
      updateUser(updatedUser);
      onComplete();
      const userRole = updatedUser.role?.toLowerCase();
      const isUnapprovedAgent = userRole === 'agent' && updatedUser.approved !== true;
      if (isUnapprovedAgent) {
        toast.success('Profile completed successfully. Your account is pending admin approval.');
        navigate('/pending-verification');
      } else {
        toast.success('Profile completed successfully');
        navigate('/home');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete profile');
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    if (!profileImage) {
      toast.error('Please upload a profile image');
      return;
    }
    if (selectedRole === 'Customer' && selectedCategories.length === 0) {
      toast.error('Please select at least one preferred category');
      return;
    }
    updateProfileMutation.mutate({ ...data, role: selectedRole });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClose = () => {
    setShowConfirmDialog(true);
  };

  const confirmLogout = () => {
    useAuthStore.getState().clearAuth();
    setShowConfirmDialog(false);
    onComplete();
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] sm:max-h-[85vh] my-6 sm:my-8 overflow-hidden p-0">
        <div className="overflow-y-auto max-h-[80vh] sm:max-h-[85vh] px-4 sm:px-6 py-4 pb-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center sm:text-left">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-center sm:text-left">Help us personalize your real estate experience</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 mt-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-blue-600">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="absolute bottom-0 right-0 bg-orange-500 text-white p-1 rounded-full shadow-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {imageUploading ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                className="hidden"
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input {...field} placeholder="John Doe" className="w-full h-10 sm:h-11 pl-10 pr-3 py-2.5 border-2 rounded-lg text-sm sm:text-base focus:outline-none focus:border-blue-600" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input {...field} type="email" placeholder="john@example.com" className="w-full h-10 sm:h-11 pl-10 pr-3 py-2.5 border-2 rounded-lg text-sm sm:text-base focus:outline-none focus:border-blue-600" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">City</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input {...field} placeholder="New York" className="w-full h-10 sm:h-11 pl-10 pr-3 py-2.5 border-2 rounded-lg text-sm sm:text-base focus:outline-none focus:border-blue-600" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => {
                const [calendarOpen, setCalendarOpen] = useState(false)
                return (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Date of Birth</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <button
                            type="button"
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2.5 border-2 rounded-lg text-left text-sm sm:text-base h-10 sm:h-11',
                              !field.value && 'text-gray-400'
                            )}
                          >
                            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                          </button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                            setCalendarOpen(false)
                          }}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )
              }}
            />

            <div>
              <label className="text-sm sm:text-base font-medium mb-2 block">Select Role</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {['Customer', 'Agent'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`p-2.5 sm:p-3 rounded-lg border-2 font-semibold transition-all text-sm sm:text-base ${
                      selectedRole === role
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-600'
                    }`}
                    onClick={() => {
                      setSelectedRole(role);
                      form.setValue('role', role as 'Customer' | 'Agent');
                      setSelectedCategories([]);
                      setReferredByAgent(null);
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {selectedRole === 'Customer' && (
              <>
                <div>
                  <label className="text-sm sm:text-base font-medium mb-2 block">
                    Preferred Property Types <span className="text-red-500">*</span>
                  </label>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm text-gray-500">Loading categories...</span>
                    </div>
                  ) : categoriesError ? (
                    <div className="flex items-center gap-2 p-3 border border-red-300 rounded-lg bg-red-50">
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-sm text-red-600">Failed to load categories</span>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">No categories available</span>
                    </div>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-3 py-2.5 border-2 rounded-lg text-left text-sm sm:text-base h-10 sm:h-11"
                        >
                          <span className={selectedCategories.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
                            {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Select categories'}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                        <div className="max-h-[200px] overflow-y-scroll p-2" style={{ overflowY: 'scroll' }}>
                          {categories.map((category: string) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className={cn(
                                'w-full flex items-center justify-between p-2 rounded hover:bg-gray-100',
                                selectedCategories.includes(category) && 'bg-blue-50'
                              )}
                            >
                              <span>{category}</span>
                              {selectedCategories.includes(category) && <Check size={16} className="text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCategories.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                        >
                          {cat}
                          <button type="button" onClick={() => toggleCategory(cat)} className="hover:text-blue-900">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm sm:text-base font-medium mb-2 block">Referred By (Optional)</label>
                  {agentsLoading ? (
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm text-gray-500">Loading agents...</span>
                    </div>
                  ) : agentsError ? (
                    <div className="flex items-center gap-2 p-3 border border-red-300 rounded-lg bg-red-50">
                      <AlertCircle size={16} className="text-red-500" />
                      <span className="text-sm text-red-600">Failed to load agents</span>
                    </div>
                  ) : (
                    <Select onValueChange={(value) => setReferredByAgent(agents.find((a: Agent) => a.id.toString() === value) || null)}>
                      <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder={referredByAgent ? referredByAgent.displayName : 'Not Applicable'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        <SelectItem value="none">Not Applicable</SelectItem>
                        {agents.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">No agents available</div>
                        ) : (
                          agents.map((agent: Agent) => (
                            <SelectItem key={agent.id} value={agent.id.toString()}>
                              {agent.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </>
            )}

            <Button type="submit" loading={updateProfileMutation.isPending} fullWidth>
              Complete Profile
            </Button>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="w-[85vw] max-w-xs sm:max-w-sm mx-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl font-bold text-center sm:text-left">Cancel Profile Completion?</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-center sm:text-left">
            Are you sure you want to cancel? You will be logged out and need to login again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
          <Button variant="outline" onClick={() => setShowConfirmDialog(false)} fullWidth>
            Continue Editing
          </Button>
          <Button variant="destructive" onClick={confirmLogout} fullWidth>
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
