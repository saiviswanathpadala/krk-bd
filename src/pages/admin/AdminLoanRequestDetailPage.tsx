import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MessageSquare, AlertCircle, FileText, Clock, User, DollarSign, MapPin, Users, AlertTriangle, StickyNote, ChevronDown, Check, Search as SearchIcon, X, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
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

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
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
    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0 animate-pulse" />
    <div className="flex-1">
      <Skeleton className="h-3 w-20 mb-1 animate-pulse" />
      <Skeleton className="h-4 w-32 animate-pulse" />
    </div>
  </div>
);

export const AdminLoanRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<Employee | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [noteText, setNoteText] = useState('');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-loan-request', id],
    queryFn: async () => {
      const response = await adminAPI.getLoanRequestById(token!, id!);
      return response.data;
    },
    enabled: !!token && !!id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const loanRequest = data?.loanRequest as LoanRequest | undefined;
  const comments = (data?.comments || []) as Comment[];
  const auditLogs = (data?.auditLogs || []) as AuditLog[];

  // Fetch finance employees for reassignment
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['finance-employees', employeeSearch],
    queryFn: async () => {
      const response = await adminAPI.getFinanceEmployees(token!, employeeSearch);
      // Handle different response structures
      const data = response?.data || response;
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (data?.employees && Array.isArray(data.employees)) return data.employees;
      return [];
    },
    enabled: showReassignModal && !!token,
    staleTime: 60000,
  });

  const employees = (employeesData || []) as Employee[];

  // Mutations
  const reassignMutation = useMutation({
    mutationFn: (data: { assigneeId?: number; autoAssign?: boolean }) =>
      adminAPI.reassignLoanRequest(token!, id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loan-request', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-loan-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-loan-request-stats'] });
      setShowReassignModal(false);
      setSelectedAssignee(null);
      setEmployeeSearch('');
      toast.success('Loan request reassigned successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to reassign request');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (reason: string) =>
      adminAPI.escalateLoanRequest(token!, id!, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loan-request', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-loan-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-loan-request-stats'] });
      setShowEscalateModal(false);
      setEscalateReason('');
      toast.success('Loan request escalated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to escalate request');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (text: string) =>
      adminAPI.addLoanRequestComment(token!, id!, { text, isPublic: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loan-request', id] });
      setShowNoteModal(false);
      setNoteText('');
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add note');
    },
  });

  const statusColors: Record<string, string> = {
    received: '#FF9800',
    under_review: '#2196F3',
    contacted: '#9C27B0',
    closed: '#4CAF50',
    rejected: '#F44336',
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
        {/* Static Header - No Loading */}
        <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate('/admin/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
          <div className="w-9 sm:w-10" />
        </header>
        <div className="px-4 sm:px-6 pt-4">
          <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-5 h-5 rounded animate-pulse" />
              <Skeleton className="h-5 w-32 animate-pulse" />
            </div>
            <div className="space-y-1">
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
              <SkeletonInfoField />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-5 h-5 rounded animate-pulse" />
              <Skeleton className="h-5 w-32 animate-pulse" />
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
        </div>
      </div>
    );
  }

  const isConnectionError = error && ((error as any)?.code === 'ECONNREFUSED' || 
                            (error as any)?.message?.includes('Network Error') ||
                            (error as any)?.response === undefined);

  if (error) {
    return (
      <div className="min-h-screen pb-8">
        {/* Static Header */}
        <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate('/admin/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
          <div className="w-9 sm:w-10" />
        </header>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 text-center">
            {isConnectionError ? 'Backend Server Not Running' : 'Failed to Load Request'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md leading-relaxed">
            {isConnectionError 
              ? 'Please make sure the backend server is running on port 3000.'
              : 'Unable to fetch loan request details. Please check your connection and try again.'}
          </p>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm sm:text-base font-semibold">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (!loanRequest) {
    return (
      <div className="min-h-screen pb-8">
        {/* Static Header */}
        <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button onClick={() => navigate('/admin/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
          <div className="w-9 sm:w-10" />
        </header>
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 text-center">Request Not Found</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md leading-relaxed">
            This loan request may have been deleted or doesn't exist.
          </p>
          <button onClick={() => navigate('/admin/loan-requests')} className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base font-semibold">Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Static Header */}
      <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button onClick={() => navigate('/admin/loan-requests')} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors" aria-label="Go back">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Loan Request</h1>
        <div className="w-9 sm:w-10" />
      </header>

      <div className="px-4 sm:px-6 pt-4 pb-4">
        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Customer Details
            </h3>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: statusColors[loanRequest.status] || '#999' }}
            >
              {formatStatus(loanRequest.status)}
            </span>
          </div>
          <div className="space-y-1">
            <InfoField icon={<User className="w-4 h-4 text-primary" />} label="Name" value={loanRequest.userName} />
            <InfoField icon={<Phone className="w-4 h-4 text-primary" />} label="Phone" value={loanRequest.userPhone} />
            <InfoField icon={<Mail className="w-4 h-4 text-primary" />} label="Email" value={loanRequest.userEmail} />
            {loanRequest.userLocation && <InfoField icon={<MapPin className="w-4 h-4 text-primary" />} label="Location" value={loanRequest.userLocation} />}
            {loanRequest.assigneeName && <InfoField icon={<User className="w-4 h-4 text-primary" />} label="Assigned To" value={loanRequest.assigneeName} />}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 mb-4 shadow-sm">
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
          <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 mb-4 shadow-sm">
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

        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={handleCall} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
              <Phone className="w-4 h-4" />
              Call
            </button>
            <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-[#25D366]/90 transition-colors font-medium text-sm">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
            <button onClick={handleEmail} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm">
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 mb-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Admin Actions
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={() => setShowReassignModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              <Users className="w-4 h-4" />
              Reassign
            </button>
            <button 
              onClick={() => setShowEscalateModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FF5722] text-white rounded-lg hover:bg-[#FF5722]/90 transition-colors font-medium text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Escalate
            </button>
            <button 
              onClick={() => setShowNoteModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-[#00a699] text-white rounded-lg hover:bg-[#00a699]/90 transition-colors font-medium text-sm"
            >
              <StickyNote className="w-4 h-4" />
              Note
            </button>
          </div>
        </div>

        {/* Reassign Modal */}
        <Dialog open={showReassignModal} onOpenChange={setShowReassignModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign Loan Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Select Employee</label>
                <Popover open={assigneeDropdownOpen} onOpenChange={setAssigneeDropdownOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg text-left text-sm bg-background hover:bg-accent transition-colors"
                    >
                      <span className={selectedAssignee ? 'text-foreground' : 'text-muted-foreground'}>
                        {selectedAssignee ? selectedAssignee.name : 'Select employee...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search employees..."
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {isLoadingEmployees ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">Loading...</div>
                      ) : employees.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">No employees found</div>
                      ) : (
                        employees.map((employee) => (
                          <button
                            key={employee.id}
                            type="button"
                            onClick={() => {
                              setSelectedAssignee(employee);
                              setAssigneeDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between p-2 rounded hover:bg-accent text-sm',
                              selectedAssignee?.id === employee.id && 'bg-accent'
                            )}
                          >
                            <div className="text-left">
                              <span className="font-medium">{employee.name}</span>
                              <p className="text-xs text-muted-foreground">{employee.email}</p>
                            </div>
                            {selectedAssignee?.id === employee.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedAssignee(null);
                  setEmployeeSearch('');
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedAssignee) {
                    toast.error('Please select an employee');
                    return;
                  }
                  reassignMutation.mutate({ assigneeId: selectedAssignee.id });
                }}
                disabled={!selectedAssignee || reassignMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {reassignMutation.isPending ? 'Reassigning...' : 'Reassign'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Escalate Modal */}
        <Dialog open={showEscalateModal} onOpenChange={setShowEscalateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escalate Loan Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Escalation Reason (Required)</label>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Enter reason for escalation..."
                  className="w-full border border-border rounded-lg p-3 text-sm text-foreground bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2">{escalateReason.length}/500 characters</p>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => {
                  setShowEscalateModal(false);
                  setEscalateReason('');
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!escalateReason.trim()) {
                    toast.error('Please enter escalation reason');
                    return;
                  }
                  if (escalateReason.trim().length < 10) {
                    toast.error('Reason must be at least 10 characters');
                    return;
                  }
                  escalateMutation.mutate(escalateReason.trim());
                }}
                disabled={!escalateReason.trim() || escalateReason.trim().length < 10 || escalateMutation.isPending}
                className="px-4 py-2 bg-[#FF5722] text-white rounded-lg hover:bg-[#FF5722]/90 transition-colors font-medium disabled:opacity-50"
              >
                {escalateMutation.isPending ? 'Escalating...' : 'Escalate'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Note Modal */}
        <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Internal Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter your note..."
                  className="w-full border border-border rounded-lg p-3 text-sm text-foreground bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-2">{noteText.length}/1000 characters</p>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!noteText.trim()) {
                    toast.error('Please enter a note');
                    return;
                  }
                  noteMutation.mutate(noteText.trim());
                }}
                disabled={!noteText.trim() || noteMutation.isPending}
                className="px-4 py-2 bg-[#00a699] text-white rounded-lg hover:bg-[#00a699]/90 transition-colors font-medium disabled:opacity-50"
              >
                {noteMutation.isPending ? 'Adding...' : 'Add Note'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

