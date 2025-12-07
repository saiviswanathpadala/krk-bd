import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, X, Image as ImageIcon, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  targetRole: string;
  isActive: boolean;
  displayOrder: number;
  status?: string;
  createdAt: string;
}

interface BannerPendingChange {
  id: string;
  bannerId?: number;
  status: string;
  isDraft?: boolean;
  proposedPayload?: Partial<Banner>;
  reason?: string;
  createdAt: string;
}

interface LocationState {
  from?: string;
  activeFilter?: 'all' | 'active' | 'inactive' | 'pending' | 'needs_revision' | 'drafts';
  changeId?: string;
  isPending?: boolean;
}

export const EmployeeBannerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      queryClient.invalidateQueries({ queryKey: ['employee-banner-pending-changes'] });
    };
  }, [queryClient]);

  const isNew = id === 'new';
  const isEdit = window.location.pathname.includes('/edit');
  const bannerId = isNew ? null : id;

  const isPendingChange = (location.state as LocationState)?.isPending || (location.state as LocationState)?.changeId;

  const { data: bannerResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['employee-banner', bannerId],
    queryFn: async () => {
      if (!bannerId) return null;
      if (isPendingChange) return null;
      const response = await employeeAPI.getBannerById(token!, bannerId);
      return response;
    },
    enabled: !!token && !!bannerId && !isNew && !isPendingChange,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: allPendingChanges, isLoading: isLoadingChanges } = useQuery({
    queryKey: ['employee-all-banner-pending-changes'],
    queryFn: async () => {
      const response = await employeeAPI.getBannerPendingChanges(token!, { limit: 100 });
      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const banner = bannerResponse?.data?.data || bannerResponse?.data || bannerResponse;
  const pendingChange = Array.isArray(allPendingChanges) 
    ? (allPendingChanges.find((c: BannerPendingChange) => 
        (c.bannerId === bannerId) && c.status === 'pending' && !c.isDraft
      ) || allPendingChanges.find((c: BannerPendingChange) => c.id === id))
    : null;

  const currentStatus = pendingChange?.status || (banner?.status === 'pending' ? 'pending' : null);
  const isNeedsRevision = currentStatus === 'needs_revision';
  const isPending = currentStatus === 'pending' || banner?.status === 'pending';
  const revisionReason = pendingChange?.reason;

  let displayBanner: Banner | null = null;
  if (pendingChange?.proposedPayload) {
    if (banner && pendingChange.bannerId) {
      displayBanner = {
        ...banner,
        imageUrl: pendingChange.proposedPayload.imageUrl || banner.imageUrl,
        title: pendingChange.proposedPayload.title || banner.title,
        subtitle: pendingChange.proposedPayload.subtitle || banner.subtitle,
        targetRole: pendingChange.proposedPayload.targetRole || banner.targetRole,
        isActive: pendingChange.proposedPayload.isActive !== undefined ? pendingChange.proposedPayload.isActive : banner.isActive,
      };
    } else {
      displayBanner = {
        id: pendingChange.id,
        imageUrl: pendingChange.proposedPayload.imageUrl || '',
        title: pendingChange.proposedPayload.title || 'Banner',
        subtitle: pendingChange.proposedPayload.subtitle || '',
        targetRole: pendingChange.proposedPayload.targetRole || 'All',
        isActive: pendingChange.proposedPayload.isActive || false,
        displayOrder: 0,
        createdAt: pendingChange.createdAt,
      };
    }
  } else if (banner) {
    displayBanner = banner;
  }

  const [withdrawAction, setWithdrawAction] = useState<'discard' | 'draft' | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  const withdrawMutation = useMutation({
    mutationFn: async (moveToDraft: boolean) => {
      const changeIdToUse = pendingChange?.id || id;
      await employeeAPI.withdrawBannerPendingChange(token!, changeIdToUse!, moveToDraft);
    },
    onSuccess: (_, moveToDraft) => {
      queryClient.invalidateQueries({ queryKey: ['employee-banner', bannerId] });
      queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
      queryClient.invalidateQueries({ queryKey: ['employee-banner-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['employee-all-banner-pending-changes'] });
      toast.success(moveToDraft ? 'Moved to drafts' : 'Changes discarded');
      navigate('/employee/banners', { state: { activeFilter: moveToDraft ? 'drafts' : activeFilter }, replace: true });
    },
    onError: () => {
      toast.error('Failed to withdraw changes');
      setWithdrawing(false);
      setWithdrawAction(null);
    },
  });

  const activeFilter = (location.state as LocationState)?.activeFilter || 'all';

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

  const handleEdit = () => {
    if (isNeedsRevision && pendingChange?.id) {
      navigate(`/employee/banners/${pendingChange.bannerId || id}/edit`, {
        state: {
          from: '/employee/banners',
          activeFilter,
          changeId: pendingChange.id,
          isNeedsRevision: true,
          draftData: pendingChange.proposedPayload,
          reason: revisionReason,
          bannerId: pendingChange.bannerId
        }
      });
    } else {
      navigate(`/employee/banners/${bannerId || id}/edit`, {
        state: {
          from: '/employee/banners',
          activeFilter
        }
      });
    }
  };

  if (isNew) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/banners" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
          <div className="w-9" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">Create New Banner</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">Use the edit page to create a new banner.</p>
          <Link to="/employee/banners/new/edit" className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base font-semibold">
            <Edit className="w-4 h-4" />
            Create Banner
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingChanges) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/banners" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
          <div className="w-9" />
        </div>
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
            <Skeleton className="w-full h-48 sm:h-64 md:h-80" />
          </div>
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 animate-pulse">
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

  if (error) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/banners" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
          <div className="w-9" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">Failed to Load Banner</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">Unable to fetch banner details. Please try again.</p>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base font-semibold" type="button">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!displayBanner) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <Link to="/employee/banners" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </Link>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
          <div className="w-9" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">Banner Not Found</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">This banner may have been deleted or doesn't exist.</p>
          <Link to="/employee/banners" className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['employee-banners'] });
            queryClient.invalidateQueries({ queryKey: ['employee-banner-pending-changes'] });
            navigate('/employee/banners', { state: { activeFilter }, replace: true });
          }} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Banner Details</h1>
        <div className="w-9" />
      </div>
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-3 sm:space-y-4 mt-2">

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

      {isNeedsRevision && revisionReason && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-3 sm:p-4 mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5">📝 Admin Requested Changes</h3>
          <p className="text-sm sm:text-base text-muted-foreground">{revisionReason}</p>
        </div>
      )}

      {isPending && !isNeedsRevision && (
        <div className="bg-orange-500/20 border border-orange-500 rounded-xl p-3 sm:p-4 mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5">⚠️ Pending Changes</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Your changes are awaiting admin review</p>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3">
        {isNeedsRevision ? (
          <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
            Edit
          </button>
        ) : isPending ? (
          <button onClick={handleWithdraw} disabled={withdrawing} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm sm:text-base disabled:opacity-50 hover:bg-destructive/90 transition-colors shadow-md hover:shadow-lg">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            {withdrawing 
              ? (withdrawAction === 'discard' ? 'Discarding...' : withdrawAction === 'draft' ? 'Moving to Draft...' : 'Withdrawing...')
              : 'Withdraw'
            }
          </button>
        ) : (
          <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm sm:text-base hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg">
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
    </div>
  );
};
