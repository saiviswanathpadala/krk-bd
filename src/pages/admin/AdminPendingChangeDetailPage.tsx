import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle, Edit3, User, AlertCircle, RefreshCw, Loader2, GitCompare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface DiffFieldProps {
  label: string;
  original: any;
  proposed: any;
  type?: 'text' | 'array' | 'image';
}

const DiffField: React.FC<DiffFieldProps> = ({ label, original, proposed, type = 'text' }) => {
  const hasChange = JSON.stringify(original) !== JSON.stringify(proposed);
  if (!hasChange && original !== undefined && proposed !== undefined) return null;

  if (type === 'array') {
    const origArray = Array.isArray(original) ? original : [];
    const propArray = Array.isArray(proposed) ? proposed : [];
    const added = propArray.filter(item => !origArray.includes(item));
    const removed = origArray.filter(item => !propArray.includes(item));
    if (added.length === 0 && removed.length === 0) return null;

    return (
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        {removed.length > 0 && (
          <div className="mb-2">
            {removed.map((item, idx) => (
              <p key={idx} className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg mb-1">
                - {String(item)}
              </p>
            ))}
          </div>
        )}
        {added.length > 0 && (
          <div>
            {added.map((item, idx) => (
              <p key={idx} className="text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg mb-1">
                + {String(item)}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Original</p>
            {original ? (
              <img src={original} alt="Original" className="w-full h-32 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-xs text-muted-foreground">None</p>
              </div>
            )}
          </div>
          <ArrowLeft className="w-5 h-5 text-muted-foreground rotate-180" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Proposed</p>
            {proposed ? (
              <img src={proposed} alt="Proposed" className="w-full h-32 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-xs text-muted-foreground">None</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Original</p>
          <div className="bg-red-50 px-3 py-2 rounded-lg min-h-[3rem] flex items-center">
            <p className="text-sm text-foreground">{original !== null && original !== undefined ? String(original) : 'None'}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Proposed</p>
          <div className="bg-green-50 px-3 py-2 rounded-lg min-h-[3rem] flex items-center">
            <p className="text-sm text-foreground">{proposed !== null && proposed !== undefined ? String(proposed) : 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="px-4 sm:px-6 pt-4">
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-7 w-3/4 mb-3" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
    <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
      <Skeleton className="h-6 w-32 mb-4" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="mb-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
    <Skeleton className="h-12 w-full rounded-lg" />
  </div>
);

export const AdminPendingChangeDetailPage: React.FC = () => {
  const { changeId } = useParams<{ changeId: string }>();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const returnFilter = (location.state as any)?.returnFilter || 'all';

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [requestChangesModalOpen, setRequestChangesModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestComments, setRequestComments] = useState('');

  const { data: change, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-pending-change', changeId],
    queryFn: async () => {
      const response = await adminAPI.getPendingChangeById(token!, changeId!);
      return response.data;
    },
    enabled: !!token && !!changeId,
    staleTime: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: () => adminAPI.approvePendingChange(token!, changeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Change approved successfully');
      navigate(backUrl);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve change');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminAPI.rejectPendingChange(token!, changeId!, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Change rejected');
      setRejectModalOpen(false);
      navigate(backUrl);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject change');
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: (comments: string) => adminAPI.requestChanges(token!, changeId!, { reason: comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-changes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-change', changeId] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Revision requested');
      setRequestChangesModalOpen(false);
      navigate(backUrl);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request changes');
    },
  });

  const backUrl = change?.type === 'banner' 
    ? (returnFilter ? `/admin/banners/list?filter=${returnFilter}` : '/admin/banners/list')
    : (returnFilter ? `/admin/properties/list?filter=${returnFilter}` : '/admin/properties/list');

  const handleApprove = () => {
    approveMutation.mutate();
    setApproveModalOpen(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate(rejectReason);
  };

  const handleRequestChanges = () => {
    if (!requestComments.trim()) {
      toast.error('Please provide comments');
      return;
    }
    requestChangesMutation.mutate(requestComments);
  };

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-30 mb-3">
          <button onClick={() => navigate(backUrl)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Pending Change</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (error || !change) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-30 mb-3">
          <button onClick={() => navigate(backUrl)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Pending Change</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Failed to Load Change</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">Unable to fetch pending change details.</p>
            <button onClick={() => refetch()} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all mx-auto shadow-md hover:shadow-lg active:scale-95">
              <RefreshCw className="w-4 h-4" />
              <span className="font-semibold">Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const original = change.originalPayload || {};
  const proposed = change.proposedPayload || {};

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-30 mb-3">
        <button onClick={() => navigate(backUrl)} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Pending Change</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 pt-4 max-w-4xl mx-auto">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${change.type === 'property' ? 'bg-green-500/10 text-green-600' : 'bg-pink-500/10 text-pink-600'}`}>
              {change.type}
            </span>
            <span className="text-xs text-muted-foreground">{new Date(change.createdAt).toLocaleString()}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-3">{proposed.title || original.title || `New ${change.type}`}</h2>
          <div className="flex items-center gap-2">
            {change.proposerAvatar ? (
              <img src={change.proposerAvatar} alt={change.proposerName} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
            <span className="text-sm text-muted-foreground">Proposed by {change.proposerName}</span>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Changes
          </h3>
          {change.type === 'property' ? (
            <>
              <DiffField label="Title" original={original.title} proposed={proposed.title} />
              <DiffField label="Location" original={original.location} proposed={proposed.location} />
              <DiffField label="Price" original={original.price} proposed={proposed.price} />
              <DiffField label="Description" original={original.description} proposed={proposed.description} />
              <DiffField label="Type" original={original.type} proposed={proposed.type} />
              <DiffField label="Features" original={original.features} proposed={proposed.features} type="array" />
              <DiffField label="Amenities" original={original.amenities} proposed={proposed.amenities} type="array" />
              {(proposed.images?.[0] !== original.images?.[0] || proposed.images?.[0]) && (
                <DiffField label="Main Image" original={original.images?.[0]} proposed={proposed.images?.[0]} type="image" />
              )}
            </>
          ) : (
            <>
              <DiffField label="Title" original={original.title} proposed={proposed.title} />
              <DiffField label="Subtitle" original={original.subtitle} proposed={proposed.subtitle} />
              <DiffField label="Target Role" original={original.targetRole} proposed={proposed.targetRole} />
              <DiffField label="Image" original={original.imageUrl} proposed={proposed.imageUrl} type="image" />
            </>
          )}
        </div>

        {change.status === 'pending' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setRejectModalOpen(true)} disabled={approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95">
              <XCircle className="w-5 h-5" />
              Reject
            </button>
            <button onClick={() => setRequestChangesModalOpen(true)} disabled={approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95">
              <Edit3 className="w-5 h-5" />
              Request Changes
            </button>
            <button onClick={() => setApproveModalOpen(true)} disabled={approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95">
              {approveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Approve
            </button>
          </div>
        )}

        {change.status === 'needs_revision' && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-600">Awaiting Employee Revision</span>
            </div>
            {change.reason && (
              <div className="mt-3 bg-card rounded-lg p-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Request Message:</p>
                <p className="text-sm text-foreground">{change.reason}</p>
              </div>
            )}
          </div>
        )}

        {change.status === 'draft' && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted text-muted-foreground">
            <Edit3 className="w-5 h-5" />
            <span className="font-semibold">Draft - Not Submitted</span>
          </div>
        )}
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRejectModalOpen(false)}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4">Reject Change</h2>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide rejection reason..." className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModalOpen(false); setRejectReason(''); }} disabled={rejectMutation.isPending} className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-all">Cancel</button>
              <button onClick={handleReject} disabled={rejectMutation.isPending} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {requestChangesModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRequestChangesModalOpen(false)}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4">Request Changes</h2>
            <textarea value={requestComments} onChange={(e) => setRequestComments(e.target.value)} placeholder="Provide feedback and requested changes..." className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setRequestChangesModalOpen(false); setRequestComments(''); }} disabled={requestChangesMutation.isPending} className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-all">Cancel</button>
              <button onClick={handleRequestChanges} disabled={requestChangesMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {requestChangesMutation.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {approveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setApproveModalOpen(false)}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4">Approve Change</h2>
            <p className="text-muted-foreground mb-6">Are you sure you want to apply this change to the live record? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setApproveModalOpen(false)} disabled={approveMutation.isPending} className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-all">Cancel</button>
              <button onClick={handleApprove} disabled={approveMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
