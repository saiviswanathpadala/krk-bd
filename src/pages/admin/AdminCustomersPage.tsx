import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Users,
  X,
  ArrowLeft,
  ChevronRight,
  Trash2,
  Loader2,
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

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  profileImgUrl?: string;
  lastLogin?: string;
  createdAt: string;
}

const CustomerRowSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm">
    <div className="flex items-center gap-2 sm:gap-3">
      <Skeleton className="w-14 h-14 rounded-full flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 sm:w-40 mb-2 animate-pulse" />
        <Skeleton className="h-3 w-40 sm:w-48 mb-1 animate-pulse" />
        <Skeleton className="h-3 w-20 sm:w-24 animate-pulse" />
      </div>
      <div className="text-right flex-shrink-0 hidden sm:block">
        <Skeleton className="h-3 w-16 sm:w-20 mb-1 animate-pulse" />
        <Skeleton className="h-3 w-12 sm:w-16 mb-2 animate-pulse" />
        <Skeleton className="h-3 w-12 sm:w-16 animate-pulse" />
      </div>
      <Skeleton className="w-5 h-5 rounded flex-shrink-0 animate-pulse" />
    </div>
  </div>
);

const CustomerRow: React.FC<{ 
  customer: Customer; 
  onClick: () => void;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  selectionMode: boolean;
}> = ({ customer, onClick, isSelected, onSelect, selectionMode }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  return (
    <div className={`w-full bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all ${
      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
    }`}>
      <div className="flex items-center gap-2 sm:gap-3">
        {selectionMode && (
          <button
            onClick={onSelect}
            className="flex-shrink-0 p-1"
            aria-label="Select customer"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        )}
        <button
          onClick={selectionMode ? onSelect : onClick}
          className="flex-1 flex items-center gap-2 sm:gap-3 text-left"
        >
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
          {customer.profileImgUrl ? (
            <img
              src={customer.profileImgUrl}
              alt={customer.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
            {customer.name || 'No Name'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
            {customer.email || 'No Email'}
          </p>
          <p className="text-xs text-muted-foreground">
            {customer.phone}
          </p>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
            {customer.city || 'No City'}
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            {formatLastLogin(customer.lastLogin)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(customer.createdAt)}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>
      </div>
    </div>
  );
};

export const AdminCustomersPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [processingBulkDelete, setProcessingBulkDelete] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: customersData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin-customers', debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const response = await adminAPI.getCustomers(token!, {
        limit: 20,
        cursor: pageParam || undefined,
        q: debouncedSearch || undefined,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
    enabled: !!token,
    staleTime: 30000,
  });

  const customers: Customer[] = customersData?.pages.flatMap((page) => page.data) || [];

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => adminAPI.bulkDeleteCustomers(token!, ids),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setSelectedIds(new Set());
      setSelectionMode(false);
      setProcessingBulkDelete(false);
      
      if (response.data.failed.length > 0) {
        toast.success(
          `${response.data.deleted.length} customers deleted. ${response.data.failed.length} failed.`
        );
      } else {
        toast.success(`${response.data.deleted.length} customers deleted successfully`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete customers');
      setProcessingBulkDelete(false);
    },
  });

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleCustomerClick = (customerId: number) => {
    if (!selectionMode) {
      navigate(`/admin/customers/${customerId}`);
    }
  };

  const handleSelectCustomer = (e: React.MouseEvent, customerId: number) => {
    e.stopPropagation();
    setSelectionMode(true);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
        if (newSet.size === 0) setSelectionMode(false);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
      setSelectionMode(true);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    setProcessingBulkDelete(true);
    bulkDeleteMutation.mutate(Array.from(selectedIds));
    setShowDeleteDialog(false);
  };

  const handleCancelSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header - Static, doesn't reload */}
      <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => navigate('/admin/home')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Customer Management</h1>
        <div className="w-9 sm:w-10" />
      </header>

      {/* Search & Selection Controls */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[60px] z-10 pb-3 pt-3 border-b border-border/30">
        <div className="px-4 sm:px-6 pt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone, city"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-card border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selection Controls */}
          {selectionMode && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  selectedIds.size === customers.length ? 'bg-primary border-primary' : 'border-primary'
                }`}>
                  {selectedIds.size === customers.length && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>Select All ({customers.length})</span>
              </button>

              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={handleBulkDelete}
                    disabled={processingBulkDelete}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {processingBulkDelete ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Delete ({selectedIds.size})</span>
                  </button>
                  <button
                    onClick={handleCancelSelection}
                    className="px-3 sm:px-4 py-2 bg-muted text-foreground rounded-lg text-xs sm:text-sm font-semibold hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Customers List */}
      <div className="px-4 sm:px-6 mt-3">
        {isLoading ? (
          <div>
            {[...Array(5)].map((_, i) => (
              <CustomerRowSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center px-4 py-12 sm:py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Failed to Load Customers</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Unable to fetch customers. Please check your connection and try again.</p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mx-auto shadow-md hover:shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm sm:text-base font-semibold">Try Again</span>
              </button>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              {searchQuery ? `No results for "${searchQuery}"` : 'No customers found'}
            </p>
            {searchQuery && (
              <p className="text-xs sm:text-sm text-muted-foreground/70 text-center mt-1">
                Try adjusting your search terms
              </p>
            )}
          </div>
        ) : (
          <div>
            {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                onClick={() => handleCustomerClick(customer.id)}
                isSelected={selectedIds.has(customer.id)}
                onSelect={(e) => handleSelectCustomer(e, customer.id)}
                selectionMode={selectionMode}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={loadMoreRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Customers</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} customer(s)?
              {(() => {
                const selectedCustomers = customers.filter(c => selectedIds.has(c.id));
                const names = selectedCustomers.slice(0, 3).map(c => c.name || 'Unknown').join(', ');
                const displayText = selectedCustomers.length > 3 
                  ? `${names} and ${selectedCustomers.length - 3} others`
                  : names;
                return (
                  <div className="mt-2 text-sm">
                    <strong>{displayText}</strong>
                  </div>
                );
              })()}
              <div className="mt-2">This action cannot be undone.</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={processingBulkDelete}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={processingBulkDelete}
              className="w-full sm:w-auto"
            >
              {processingBulkDelete ? (
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
    </div>
  );
};
