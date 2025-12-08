import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MessageSquare, AlertCircle, FileText, Clock, User, DollarSign, Check, ChevronDown, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { employeeAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LoanRequest {
  id: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  userLocation?: string;
  loanType: string;
  loanAmountNeeded: number;
  propertyValue?: number;
  propertyCategory: string;
  employmentType?: string;
  monthlyIncome?: number;
  preferredTenure?: string;
  preferredContactTime?: string;
  existingLoans?: boolean;
  existingLoanDetails?: string;
  additionalNotes?: string;
  status: string;
  assigneeId?: number;
  assigneeName?: string;
  createdAt: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string;
}

interface AuditLog {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  actorName?: string;
}

const InfoField: React.FC<{ icon: React.ReactNode; label: string; value: string | number; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
  <div className="flex items-start gap-3 py-2.5">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  </div>
);

const SkeletonInfoField = () => (
  <div className="flex items-start gap-3 py-2.5">
    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-3 w-20 mb-1" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

export const EmployeeLoanRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user } = useAuthStore();
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [commentText, setCommentText] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['employee-loan-requests'] });
    };
  }, [queryClient]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employee-loan-request', id],
    queryFn: async () => {
      const response = await employeeAPI.getLoanRequestById(token!, id!);
      return response.data;
    },
    enabled: !!token && !!id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const takeMutation = useMutation({
    mutationFn: () => employeeAPI.takeLoanRequest(token!, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-loan-request', id] });
      queryClient.invalidateQueries({ queryKey: ['employee-loan-requests'] });
      toast.success('Loan request assigned to you');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to take request');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data: { status: string; comment?: string }) => 
      employeeAPI.updateLoanRequestStatus(token!, id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-loan-request', id] });
      queryClient.invalidateQueries({ queryKey: ['employee-loan-requests'] });
      setShowStatusModal(false);
      setStatusComment('');
      setSelectedStatus('');
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => 
      employeeAPI.addLoanRequestComment(token!, id!, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-loan-request', id] });
      setShowCommentModal(false);
      setCommentText('');
      toast.success('Comment added');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add comment');
    },
  });

  const loanRequest = data?.loanRequest as LoanRequest | undefined;
  const comments = (data?.comments || []) as Comment[];
  const auditLogs = (data?.auditLogs || []) as AuditLog[];

  const isAssignedToMe = loanRequest?.assigneeId === user?.id;
  const canTake = !loanRequest?.assigneeId || !isAssignedToMe;

  const statusOptions: Record<string, string[]> = {
    received: ['under_review', 'rejected'],
    under_review: ['contacted', 'rejected'],
    contacted: ['closed', 'rejected'],
  };

  const availableStatuses = statusOptions[loanRequest?.status || ''] || [];

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const statusColors: Record<string, string> = {
    received: '#FF9800',
    under_review: '#2196F3',
    contacted: '#9C27B0',
    closed: '#4CAF50',
    rejected: '#F44336',
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'closed' || status === 'rejected') {
      setShowStatusModal(true);
    } else {
      statusMutation.mutate({ status });
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${loanRequest?.userPhone}`;
  };

  const handleWhatsApp = () => {
    const phone = loanRequest?.userPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${loanRequest?.userEmail}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const activityTimeline = [
    ...comments.map(c => ({ ...c, type: 'comment' as const })),
    ...auditLogs.map(a => ({ ...a, type: 'audit' as const }))
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (isLoading) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate('/employee/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="px-4 sm:px-6 pt-4">
          <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-1">
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-4 shadow-sm animate-pulse">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Skeleton className="h-10 w-20 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate('/employee/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Failed to Load Request</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
              Unable to fetch loan request details. Please check your connection and try again.
            </p>
            <button onClick={() => refetch()} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all mx-auto shadow-md hover:shadow-lg active:scale-95">
              <FileText className="w-4 h-4" />
              <span className="font-semibold">Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!loanRequest) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate('/employee/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 text-center">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Request Not Found</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
              This loan request may have been deleted or doesn't exist.
            </p>
            <button onClick={() => navigate('/employee/loan-requests')} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all mx-auto shadow-md hover:shadow-lg active:scale-95">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Go Back</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button onClick={() => navigate('/employee/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="px-4 sm:px-6 pt-4 pb-4">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Customer Details
          </h3>
          <div className="space-y-1">
            <InfoField icon={<User className="w-4 h-4 text-primary" />} label="Name" value={loanRequest.userName} />
            <InfoField icon={<Phone className="w-4 h-4 text-primary" />} label="Phone" value={loanRequest.userPhone} />
            <InfoField icon={<Mail className="w-4 h-4 text-primary" />} label="Email" value={loanRequest.userEmail} />
            {loanRequest.userLocation && <InfoField icon={<MapPin className="w-4 h-4 text-primary" />} label="Location" value={loanRequest.userLocation} />}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Loan Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <InfoField icon={<FileText className="w-4 h-4 text-primary" />} label="Loan Type" value={loanRequest.loanType} />
            <InfoField icon={<DollarSign className="w-4 h-4 text-primary" />} label="Amount Needed" value={formatAmount(loanRequest.loanAmountNeeded)} highlight />
            {loanRequest.propertyValue && <InfoField icon={<DollarSign className="w-4 h-4 text-primary" />} label="Property Value" value={formatAmount(loanRequest.propertyValue)} />}
            <InfoField icon={<FileText className="w-4 h-4 text-primary" />} label="Category" value={loanRequest.propertyCategory} />
            {loanRequest.employmentType && <InfoField icon={<User className="w-4 h-4 text-primary" />} label="Employment" value={loanRequest.employmentType} />}
            {loanRequest.monthlyIncome && <InfoField icon={<DollarSign className="w-4 h-4 text-primary" />} label="Monthly Income" value={formatAmount(loanRequest.monthlyIncome)} />}
            {loanRequest.preferredTenure && <InfoField icon={<Clock className="w-4 h-4 text-primary" />} label="Tenure" value={loanRequest.preferredTenure} />}
            {loanRequest.preferredContactTime && <InfoField icon={<Clock className="w-4 h-4 text-primary" />} label="Contact Time" value={loanRequest.preferredContactTime} />}
          </div>
          {loanRequest.existingLoans && loanRequest.existingLoanDetails && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <InfoField icon={<AlertCircle className="w-4 h-4 text-primary" />} label="Existing Loans" value={loanRequest.existingLoanDetails} />
            </div>
          )}
          {loanRequest.additionalNotes && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <InfoField icon={<FileText className="w-4 h-4 text-primary" />} label="Additional Notes" value={loanRequest.additionalNotes} />
            </div>
          )}
        </div>

        {activityTimeline.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-4 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Activity Timeline
            </h3>
            {activityTimeline.map((item, idx) => (
              <div key={idx} className="flex gap-3 py-2.5 border-b border-border/30 last:border-0">
                {item.type === 'comment' ? (
                  <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-foreground mb-1">
                    {item.type === 'comment' ? (item as Comment).text : `${(item as AuditLog).action}: ${(item as AuditLog).newValue || ''}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.type === 'comment' ? (item as Comment).authorName : (item as AuditLog).actorName} • {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4 sm:p-5 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={handleCall} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
              <Phone className="w-4 h-4" />
              Call
            </button>
            <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
            <button onClick={handleEmail} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm">
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        </div>

        {canTake && (
          <button onClick={() => takeMutation.mutate()} disabled={takeMutation.isPending} className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 mb-4">
            {takeMutation.isPending ? 'Taking...' : 'Take Request'}
          </button>
        )}

        {isAssignedToMe && (
          <div className="flex gap-3">
            {availableStatuses.length > 0 && (
              <button onClick={() => setShowStatusModal(true)} className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
                Change Status
              </button>
            )}
            <button onClick={() => setShowCommentModal(true)} className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-semibold">
              Add Note
            </button>
          </div>
        )}
      </div>

      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select Status</label>
              <Popover open={statusDropdownOpen} onOpenChange={setStatusDropdownOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg text-left text-sm bg-background hover:bg-accent transition-colors">
                    <span className={selectedStatus ? 'text-foreground' : 'text-muted-foreground'}>
                      {selectedStatus ? formatStatus(selectedStatus) : 'Select status...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                  {availableStatuses.map(status => (
                    <button key={status} type="button" onClick={() => { setSelectedStatus(status); setStatusDropdownOpen(false); }} className={cn('w-full flex items-center justify-between p-2 rounded hover:bg-accent text-sm', selectedStatus === status && 'bg-accent')}>
                      <span>{formatStatus(status)}</span>
                      {selectedStatus === status && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            {(selectedStatus === 'closed' || selectedStatus === 'rejected') && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Comment (Required)</label>
                <textarea value={statusComment} onChange={(e) => setStatusComment(e.target.value)} placeholder="Required for closing or rejecting" className="w-full border border-border rounded-lg p-3 text-sm text-foreground bg-background min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary" maxLength={1000} />
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => { setShowStatusModal(false); setStatusComment(''); setSelectedStatus(''); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium">
              Cancel
            </button>
            <button onClick={() => statusMutation.mutate({ status: selectedStatus, comment: statusComment })} disabled={!selectedStatus || ((selectedStatus === 'closed' || selectedStatus === 'rejected') && !statusComment.trim()) || statusMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
              {statusMutation.isPending ? 'Updating...' : 'Confirm'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
          </DialogHeader>
          <div>
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Enter your note..." className="w-full border border-border rounded-lg p-3 text-sm text-foreground bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary" maxLength={1000} />
            <p className="text-xs text-muted-foreground mt-2">{commentText.length}/1000 characters</p>
          </div>
          <DialogFooter>
            <button onClick={() => { setShowCommentModal(false); setCommentText(''); }} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium">
              Cancel
            </button>
            <button onClick={() => commentMutation.mutate(commentText)} disabled={!commentText.trim() || commentMutation.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
              {commentMutation.isPending ? 'Adding...' : 'Add Note'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
