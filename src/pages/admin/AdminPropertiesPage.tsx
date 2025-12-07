import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Image,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  properties: {
    total: number;
    pending: number;
    needsRevision: number;
  };
  banners: {
    active: number;
    pending: number;
    needsRevision: number;
  };
  lastUpdated: string;
}

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  metric1Label: string;
  metric1Value: number;
  metric2Label: string;
  metric2Value: number;
  metric3Label: string;
  metric3Value: number;
  color: string;
  buttonText: string;
  onPress: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  icon,
  metric1Label,
  metric1Value,
  metric2Label,
  metric2Value,
  metric3Label,
  metric3Value,
  color,
  buttonText,
  onPress,
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toLocaleString();
  };

  return (
    <div className="h-full bg-card rounded-xl shadow-md border border-border/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="h-full p-4 sm:p-5 flex flex-col">
        {/* Header */}
        <div className="flex items-center mb-3 sm:mb-4">
          <div 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mr-2 sm:mr-3 transition-transform group-hover:scale-110 duration-300 flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            <div className="text-white">
              {icon}
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{title}</h3>
        </div>

        {/* Metrics - Fixed Height */}
        <div className="flex-1 mb-3 sm:mb-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 h-full">
            <div 
              className="p-2.5 sm:p-3 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200"
              style={{ backgroundColor: color + '15' }}
            >
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 text-center">{metric1Label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(metric1Value)}</p>
            </div>
            <div 
              className="p-2.5 sm:p-3 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200"
              style={{ backgroundColor: color + '15' }}
            >
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 text-center">{metric2Label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(metric2Value)}</p>
            </div>
            <div 
              className="p-2.5 sm:p-3 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105 duration-200"
              style={{ backgroundColor: color + '15' }}
            >
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 text-center">{metric3Label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(metric3Value)}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onPress}
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-95 whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1 duration-200" />
        </button>
      </div>
    </div>
  );
};

const StatCardSkeleton = () => (
  <div className="h-full bg-card rounded-xl shadow-md border border-border/50 animate-pulse">
    <div className="h-full p-4 sm:p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-3 sm:mb-4">
        <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg mr-2 sm:mr-3 flex-shrink-0" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Metrics - Fixed Height */}
      <div className="flex-1 mb-3 sm:mb-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 h-full">
          <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 flex flex-col items-center justify-center">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Skeleton className="w-full h-9 sm:h-11 rounded-lg" />
    </div>
  </div>
);

export const AdminPropertiesPage: React.FC = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const {
    data: stats,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await adminAPI.getDashboardStats(token!);
      return response.data;
    },
    enabled: !!token,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/admin/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Management</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 auto-rows-fr">
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/admin/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Management</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Failed to Load Stats</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
              Unable to fetch dashboard statistics. Please check your connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-auto shadow-md hover:shadow-lg active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{isRefetching ? 'Retrying...' : 'Try Again'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statsData = stats
    ? [
        {
          id: 'properties',
          title: 'Properties',
          icon: <Building2 className="w-5 h-5" />,
          metric1Label: 'Total Properties',
          metric1Value: stats.properties.total,
          metric2Label: 'Pending Review',
          metric2Value: stats.properties.pending,
          metric3Label: 'Needs Revision',
          metric3Value: stats.properties.needsRevision,
          color: '#10B981',
          buttonText: 'View Details',
          onPress: () => navigate('/admin/properties/list'),
        },
        {
          id: 'banners',
          title: 'Banners',
          icon: <Image className="w-5 h-5" />,
          metric1Label: 'Active Banners',
          metric1Value: stats.banners.active,
          metric2Label: 'Pending Review',
          metric2Value: stats.banners.pending,
          metric3Label: 'Needs Revision',
          metric3Value: stats.banners.needsRevision,
          color: '#EC4899',
          buttonText: 'View Details',
          onPress: () => navigate('/admin/banners/list'),
        },
      ]
    : [];

  if (!stats) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-3">
          <button
            onClick={() => navigate('/admin/home')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Management</h1>
          <div className="w-9 sm:w-10" />
        </div>
        <div className="flex items-center justify-center px-4 py-12 sm:py-16">
          <div className="max-w-md w-full bg-card rounded-2xl shadow-lg border border-border p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No Data Available</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Dashboard statistics are not available at the moment.
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all mx-auto shadow-md hover:shadow-lg active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-semibold">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-30 mb-3">
        <button
          onClick={() => navigate('/admin/home')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Property Management</h1>
        <div className="w-9 sm:w-10" />
      </div>

      {/* Stat Cards Grid */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 auto-rows-fr">
          {statsData.map((stat, index) => (
            <div
              key={stat.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
