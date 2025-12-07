import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Briefcase,
  X,
  Plus,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  profileImgUrl?: string;
  lastLogin?: string;
  createdAt: string;
  propertiesCount?: number;
  agentsCount?: number;
}

const EmployeeRowSkeleton = () => (
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
        <Skeleton className="h-3 w-16 sm:w-20 animate-pulse" />
      </div>
      <Skeleton className="w-5 h-5 rounded flex-shrink-0 animate-pulse" />
    </div>
  </div>
);

const EmployeeRow: React.FC<{ 
  employee: Employee; 
  onClick: () => void;
}> = ({ employee, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full bg-card rounded-xl border border-border/50 p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 sm:gap-3">
    <button
      onClick={onClick}
          className="flex-1 flex items-center gap-2 sm:gap-3 text-left"
    >
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
          {employee.profileImgUrl ? (
            <img
              src={employee.profileImgUrl}
              alt={employee.name}
              className="w-full h-full object-cover"
            />
          ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate mb-1">
            {employee.name || 'No Name'}
          </h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
            {employee.email || 'No Email'}
          </p>
            <p className="text-xs text-muted-foreground">
            {employee.phone}
          </p>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-1 capitalize">
            {employee.department || 'No Department'}
          </p>
            <p className="text-xs text-muted-foreground mb-2">
            {formatDate(employee.createdAt)}
          </p>
          {(employee.propertiesCount !== undefined || employee.agentsCount !== undefined) && (
              <div className="flex flex-col gap-0.5">
              {employee.propertiesCount !== undefined && (
                  <p className="text-xs text-muted-foreground">
                  {employee.propertiesCount} {employee.propertiesCount === 1 ? 'property' : 'properties'}
                </p>
              )}
              {employee.agentsCount !== undefined && (
                  <p className="text-xs text-muted-foreground">
                  {employee.agentsCount} {employee.agentsCount === 1 ? 'agent' : 'agents'}
                </p>
              )}
            </div>
          )}
          </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </button>
      </div>
      </div>
  );
};

export const AdminEmployeesPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<'all' | 'Sales' | 'Marketing' | 'Finance' | 'Operations' | 'HR' | 'IT'>('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: employeesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin-employees', debouncedSearch, selectedDepartment],
    queryFn: async ({ pageParam }) => {
      const response = await adminAPI.getEmployees(token!, {
        limit: 20,
        cursor: pageParam as string | undefined,
        q: debouncedSearch || undefined,
        department: selectedDepartment === 'all' ? undefined : selectedDepartment,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!token,
    staleTime: 30000,
  });

  const employees: Employee[] = employeesData?.pages.flatMap((page) => page.data) || [];

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

  const handleEmployeeClick = (employeeId: number) => {
    navigate(`/admin/employees/${employeeId}`);
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
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Employee Management</h1>
        <button
          onClick={() => navigate('/admin/employees/new')}
          className="p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
          title="Add Employee"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
      </header>

      {/* Filter Chips */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[60px] z-10 px-4 sm:px-6 pt-5 pb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'Sales', label: 'Sales' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Operations', label: 'Operations' },
            { value: 'HR', label: 'HR' },
            { value: 'IT', label: 'IT' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedDepartment(filter.value as any)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                selectedDepartment === filter.value
                  ? 'bg-black text-white shadow-md'
                  : 'bg-card text-muted-foreground border border-border/50 hover:border-black/50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

        {/* Search */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-[120px] z-10 pb-3 border-b border-border/30">
        <div className="px-4 sm:px-6 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, phone, department"
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
          </div>
        </div>

        {/* Employees List */}
      <div className="px-4 sm:px-6 mt-3">
          {isLoading ? (
            <div>
              {[...Array(5)].map((_, i) => (
                <EmployeeRowSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
          <div className="flex items-center justify-center px-4 py-12 sm:py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Failed to Load Employees</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Unable to fetch employees. Please check your connection and try again.</p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mx-auto shadow-md hover:shadow-lg active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm sm:text-base font-semibold">Try Again</span>
              </button>
            </div>
            </div>
          ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
            <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              {searchQuery ? `No results for "${searchQuery}"` : 'No employees found'}
            </p>
            {searchQuery && (
              <p className="text-xs sm:text-sm text-muted-foreground/70 text-center mt-1">
                Try adjusting your search terms
              </p>
            )}
            </div>
          ) : (
          <div>
                {employees.map((employee) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    onClick={() => handleEmployeeClick(employee.id)}
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
    </div>
  );
};
