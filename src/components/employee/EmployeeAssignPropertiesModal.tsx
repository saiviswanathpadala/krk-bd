import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Building2, MapPin, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { employeeAPI } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  location: string;
  price?: number;
  images: string[];
}

interface EmployeeAssignPropertiesModalProps {
  visible: boolean;
  agentId: number;
  agentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeAssignPropertiesModal: React.FC<EmployeeAssignPropertiesModalProps> = ({
  visible,
  agentId,
  agentName,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const { data: assignedData, isLoading: isLoadingAssigned } = useQuery({
    queryKey: ['agent-assigned-properties', agentId],
    queryFn: async () => {
      const response = await employeeAPI.getAgentAssignedProperties(token!, agentId);
      return response.data.data;
    },
    enabled: visible && !!token,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useInfiniteQuery({
    queryKey: ['employee-properties-for-assign', debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const response = await employeeAPI.getProperties(token!, {
        cursor: pageParam || undefined,
        q: debouncedSearch || undefined,
        limit: 20,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: visible && !!token,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const assignMutation = useMutation({
    mutationFn: async (propertyIds: string[]) => {
      return employeeAPI.assignPropertiesToAgent(token!, agentId, propertyIds);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['employee-agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-assigned-properties', agentId] });
      queryClient.invalidateQueries({ queryKey: ['employee-properties'] });
      queryClient.invalidateQueries({ queryKey: ['employee-dashboard-stats'] });
      const { added, removed } = response.data;
      const message = added > 0 && removed > 0 
        ? `Added ${added} and removed ${removed} ${added + removed === 1 ? 'property' : 'properties'}`
        : added > 0 
        ? `Added ${added} ${added === 1 ? 'property' : 'properties'}`
        : `Removed ${removed} ${removed === 1 ? 'property' : 'properties'}`;
      toast.success(message);
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update assignments';
      toast.error(message);
    },
  });

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (visible && assignedData) {
      setSelectedIds(new Set(assignedData));
    } else if (!visible) {
      setSearchQuery('');
      setSelectedIds(new Set());
    }
  }, [visible, assignedData]);

  const properties = useMemo(() => data?.pages.flatMap(page => page.data) || [], [data]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const handleAssign = useCallback(() => {
    assignMutation.mutate(Array.from(selectedIds));
  }, [selectedIds, assignMutation]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-2xl sm:rounded-xl rounded-t-3xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg sm:text-xl font-bold text-foreground pr-4">Assign Properties to {agentName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0" aria-label="Close">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <input type="text" placeholder="Search properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-muted/50 border border-border rounded-lg text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Clear search"><X className="w-4 h-4" /></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading || isLoadingAssigned ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 sm:p-4 border-2 border-border rounded-xl">
                  <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0"><Skeleton className="h-4 sm:h-5 w-3/4 mb-2" /><Skeleton className="h-3 sm:h-4 w-1/2 mb-2" /><Skeleton className="h-3 sm:h-4 w-1/3" /></div>
                  <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
              <p className="text-sm sm:text-base text-foreground font-semibold mb-2 text-center">Failed to Load Properties</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 text-center max-w-sm">Unable to fetch properties. Please try again.</p>
              <button onClick={() => refetch()} className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm sm:text-base font-semibold">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
              <p className="text-sm sm:text-base text-foreground text-center font-semibold mb-2">{searchQuery ? `No properties found for "${searchQuery}"` : 'No properties available'}</p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-sm">{searchQuery ? 'Try adjusting your search terms' : 'Create properties to assign them to agents'}</p>
            </div>
          ) : (
            <>
              {properties.map((property) => {
                const isSelected = selectedIds.has(property.id);
                return (
                  <button key={property.id} onClick={() => toggleSelection(property.id)} className={`w-full flex items-center gap-3 p-3 sm:p-4 mb-3 rounded-xl border-2 transition-all hover:shadow-md ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}`}>
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                      {property.images?.[0] ? <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=Property'; }} /> : <div className="w-full h-full bg-muted flex items-center justify-center"><Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" /></div>}
                      <div className={`absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'bg-white border-border'}`}>{isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}</div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">{property.title}</p>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-1"><MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /><span className="truncate">{property.location}</span></div>
                      {property.price && <p className="text-xs sm:text-sm font-semibold text-primary">₹{property.price.toLocaleString()}</p>}
                    </div>
                  </button>
                );
              })}
              {isFetchingNextPage && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" /></div>}
              <div ref={loadMoreRef} className="h-4" />
            </>
          )}
        </div>
        <div className="border-t border-border p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <p className="text-sm sm:text-base font-semibold text-muted-foreground text-center sm:text-left">{selectedIds.size} {selectedIds.size === 1 ? 'property' : 'properties'} selected</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 border border-border rounded-lg text-sm sm:text-base font-semibold text-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={handleAssign} disabled={assignMutation.isPending} className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[100px] flex items-center justify-center">{assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
