import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  RefreshCw,
  Trash2,
  MessageCircle,
  User,
  AlertCircle,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Edit,
  Building2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const personChatAPI = {
  createOrGetConversation: (token: string, participantId: number) =>
    axios.post(`${API_BASE_URL}/chat/person/conversations`, { participantId }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  profileImgUrl?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  assignedProperties: Array<{ id: string; title: string; location: string; images: string[] }>;
  assignedAgents: Array<{ id: number; name: string; email: string; phone: string; profileImgUrl?: string }>;
}

const InfoRow: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 mb-4 last:mb-0">
    <div className="w-6 flex items-center justify-center pt-0.5 flex-shrink-0">
      <div className="text-[#A855F7]">
        {icon}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-base font-medium text-foreground break-words">{value || 'Not provided'}</p>
    </div>
  </div>
);

const ReassignModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  propertiesCount: number;
  agentsCount: number;
  onConfirm: (targetId: number) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, employeeId, employeeName, propertiesCount, agentsCount, onConfirm, isLoading }) => {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [confirmText, setConfirmText] = useState('');

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['admin-employees-lookup', searchQuery],
    queryFn: async () => {
      const response = await adminAPI.getEmployees(token!, { q: searchQuery, limit: 50 });
      return response.data.data;
    },
    enabled: isOpen && !!token,
  });

  const employeeList = (employees || []).filter((emp: any) => emp.id !== employeeId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Reassign & Delete</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <p className="text-muted-foreground mb-4">
          {employeeName} has {propertiesCount} properties and {agentsCount} agents assigned.
          Select an employee to reassign them to:
        </p>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search employees..."
          className="w-full p-3 border border-border rounded-lg bg-background text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="max-h-48 overflow-y-auto mb-4">
          {isLoadingEmployees ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 rounded-lg">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {employeeList.map((emp: any) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEmployee?.id === emp.id ? 'bg-primary/20' : 'hover:bg-muted'
                  }`}
                >
                  <p className="font-semibold text-foreground">{emp.name}</p>
                  <p className="text-sm text-muted-foreground">{emp.department}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedEmployee && (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              Type "{employeeName}" to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedEmployee && confirmText === employeeName && onConfirm(selectedEmployee.id)}
            disabled={!selectedEmployee || confirmText !== employeeName || isLoading}
            className="px-4 py-2 rounded-lg font-medium text-white bg-destructive hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminEmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const employeeId = id ? parseInt(id) : null;
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const {
    data: employee,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<Employee>({
    queryKey: ['admin-employee', employeeId],
    queryFn: async () => {
      const response = await adminAPI.getEmployeeById(token!, employeeId!);
      return response.data;
    },
    enabled: !!token && !!employeeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deleteEmployee(token!, employeeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Employee deleted successfully');
      navigate('/admin/employees');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    },
  });

  const reassignDeleteMutation = useMutation({
    mutationFn: (targetId: number) => adminAPI.reassignAndDeleteEmployee(token!, employeeId!, { targetEmployeeId: targetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Employee deleted and assignments reassigned');
      navigate('/admin/employees');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reassign and delete employee');
    },
  });

  const handleDelete = () => {
    if (!employee) return;
    
    const hasAssignments = employee.assignedProperties.length > 0 || employee.assignedAgents.length > 0;
    
    if (hasAssignments) {
      setShowDeleteModal(false);
      setShowReassignModal(true);
    } else {
      deleteMutation.mutate();
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
              navigate('/admin/employees');
            }}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Employee Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col items-center mb-6">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4" />
              <Skeleton className="h-6 sm:h-7 w-40 sm:w-48 mb-3" />
              <Skeleton className="h-6 w-28 rounded-full mb-4" />
              <div className="flex gap-3">
                <Skeleton className="h-11 w-24 rounded-lg" />
                <Skeleton className="h-11 w-24 rounded-lg" />
              </div>
            </div>
            
            <div className="border-t border-border pt-6 mb-6">
              <Skeleton className="h-5 sm:h-6 w-40 mb-4" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-full max-w-xs" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-6 mb-6">
              <Skeleton className="h-5 sm:h-6 w-48 mb-4" />
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                  <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-6 mb-6">
              <Skeleton className="h-5 sm:h-6 w-40 mb-4" />
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-6">
              <Skeleton className="h-12 sm:h-14 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!employee && !isLoading)) {
    const isConnectionError = (error as any)?.code === 'ECONNREFUSED' || 
                              (error as any)?.message?.includes('Network Error') ||(error as any)?.response === undefined;
    
    return (
      <div className="min-h-screen pb-8">
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
          <button
            onClick={() => navigate('/admin/employees')}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Employee Details</h1>
          <div className="w-9 sm:w-10" />
        </div>
        
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">
            {isConnectionError ? 'Backend Server Not Running' : 'Employee Not Found'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 text-center max-w-md">
            {isConnectionError 
              ? 'Please make sure the backend server is running on port 3000.'
              : "The employee you're looking for doesn't exist or has been deleted."}
          </p>
          <button
            onClick={() => isConnectionError ? refetch() : navigate('/admin/employees')}
            disabled={isRefetching}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isConnectionError ? (
              <>
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="text-sm sm:text-base font-semibold">{isRefetching ? 'Retrying...' : 'Try Again'}</span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-semibold">Go Back</span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
            navigate('/admin/employees');
          }}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Employee Details</h1>
        <div className="w-9 sm:w-10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4">
              {employee.profileImgUrl ? (
                <img
                  src={employee.profileImgUrl}
                  alt={employee.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#A855F7]/20 flex items-center justify-center ${employee.profileImgUrl ? 'hidden' : ''}`}>
                <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 text-[#A855F7]" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 text-center">
              {employee.name || 'No Name'}
            </h2>

            <div className="flex items-center gap-2 flex-wrap justify-center mb-4">
              <span className="px-4 py-2 text-xs font-semibold bg-[#A855F7] text-white rounded-full capitalize">
                {employee.department}
              </span>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => navigate(`/admin/employees/${employeeId}/edit`, { state: { employee } })}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-md"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={async () => {
                  try {
                    await personChatAPI.createOrGetConversation(token!, employee.id);
                    navigate('/chat', {
                      state: {
                        participantId: employee.id,
                        participantName: employee.name,
                        participantRole: 'employee',
                        participantProfileImg: employee.profileImgUrl,
                      }
                    });
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || 'Failed to open chat');
                  }
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                Chat
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Contact Information</h3>
            <InfoRow
              icon={<Mail className="w-5 h-5" />}
              label="Email"
              value={employee.email}
            />
            <InfoRow
              icon={<Phone className="w-5 h-5" />}
              label="Phone"
              value={employee.phone}
            />
            <InfoRow
              icon={<Calendar className="w-5 h-5" />}
              label="Joined"
              value={formatDate(employee.createdAt)}
            />
            <InfoRow
              icon={<Clock className="w-5 h-5" />}
              label="Last Login"
              value={employee.lastLogin ? formatDate(employee.lastLogin) : 'Never'}
            />
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Assigned Properties ({employee.assignedProperties.length})
            </h3>
            {employee.assignedProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3" />
                <p className="text-sm sm:text-base text-muted-foreground text-center">No properties assigned</p>
              </div>
            ) : (
              <div className="space-y-0">
                {employee.assignedProperties.map((property) => (
                  <Link
                    key={property.id}
                    to={`/admin/properties/${property.id}`}
                    state={{ returnTo: `/admin/employees/${employeeId}` }}
                    className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                  >
                    {property.images?.[0] && (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-foreground truncate">{property.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{property.location}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
              Assigned Agents ({employee.assignedAgents.length})
            </h3>
            {employee.assignedAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3" />
                <p className="text-sm sm:text-base text-muted-foreground text-center">No agents assigned</p>
              </div>
            ) : (
              <div className="space-y-0">
                {employee.assignedAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    to={`/admin/agents/${agent.id}`}
                    state={{ returnTo: `/admin/employees/${employeeId}` }}
                    className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                  >
                    {agent.profileImgUrl ? (
                      <img
                        src={agent.profileImgUrl}
                        alt={agent.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${agent.profileImgUrl ? 'hidden' : ''}`}>
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-foreground truncate">{agent.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{agent.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteMutation.isPending || reassignDeleteMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-destructive text-destructive-foreground rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
              Delete Employee
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employee?.name || 'this employee'}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
      
      <ReassignModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        employeeId={employeeId!}
        employeeName={employee?.name || ''}
        propertiesCount={employee?.assignedProperties.length || 0}
        agentsCount={employee?.assignedAgents.length || 0}
        onConfirm={(targetId) => reassignDeleteMutation.mutate(targetId)}
        isLoading={reassignDeleteMutation.isPending}
      />
    </div>
  );
};
