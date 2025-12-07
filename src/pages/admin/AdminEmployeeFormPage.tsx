import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Briefcase, Building2, Loader2, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';

const DEPARTMENTS = ['Sales', 'Marketing', 'Finance', 'Operations', 'HR', 'IT'];

interface Property {
  id: string;
  title: string;
  location: string;
  images?: string[];
}

interface Agent {
  id: number;
  name: string;
  email: string;
  profileImgUrl?: string;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
}

interface MultiSelectModalProps {
  visible: boolean;
  title: string;
  type: 'properties' | 'agents';
  selected: any[];
  onClose: () => void;
  onConfirm: (items: any[]) => void;
}

const MultiSelectModal: React.FC<MultiSelectModalProps> = ({
  visible,
  title,
  type,
  selected,
  onClose,
  onConfirm,
}) => {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>(selected);

  useEffect(() => {
    if (visible) {
      setSelectedItems(selected);
      setSearchQuery('');
    }
  }, [visible, selected]);

  const { data, isLoading } = useQuery({
    queryKey: [type === 'properties' ? 'properties-lookup' : 'agents-lookup', searchQuery],
    queryFn: () =>
      type === 'properties'
        ? adminAPI.getPropertiesLookup(token!, searchQuery)
        : adminAPI.getAgentsLookup(token!, searchQuery),
    enabled: visible && !!token,
  });

  const items = data?.data.data || [];

  const toggleItem = (item: any) => {
    const exists = selectedItems.find((i) => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">{title}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <p className="text-sm text-muted-foreground">Selected: {selectedItems.length}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2 animate-pulse" />
                    <Skeleton className="h-3 w-48 animate-pulse" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `No results for "${searchQuery}"` : `No ${type} found`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item: any) => {
                const isSelected = selectedItems.find((i) => i.id === item.id);
                const isAssigned = type === 'agents' && item.assignedEmployeeId && item.assignedEmployeeName;
                const isDisabled = isAssigned && !isSelected;

                return (
                  <button
                    key={item.id}
                    onClick={() => !isDisabled && toggleItem(item)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isSelected ? 'bg-primary/10 border-2 border-primary' : 'bg-background border border-border hover:bg-muted'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {type === 'properties' && item.images?.[0] && (
                      <img src={item.images[0]} alt={item.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    {type === 'agents' && (
                      item.profileImgUrl ? (
                        <img src={item.profileImgUrl} alt={item.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#00a699]/20 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-[#00a699]" />
                        </div>
                      )
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {type === 'properties' ? item.title : item.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {type === 'properties' ? item.location : item.email}
                      </p>
                      {isAssigned && (
                        <p className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded mt-1 inline-block">
                          Assigned to {item.assignedEmployeeName}
                        </p>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(selectedItems);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminEmployeeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const isEdit = !!id;
  const stateEmployee = location.state?.employee;

  const [name, setName] = useState(stateEmployee?.name || '');
  const [email, setEmail] = useState(stateEmployee?.email || '');
  const [phone, setPhone] = useState(stateEmployee?.phone || '');
  const [department, setDepartment] = useState(stateEmployee?.department || '');
  const [selectedProperties, setSelectedProperties] = useState<Property[]>(stateEmployee?.assignedProperties || []);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>(stateEmployee?.assignedAgents || []);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);

  const { data: employeeData } = useQuery({
    queryKey: ['admin-employee', id],
    queryFn: async () => {
      const response = await adminAPI.getEmployeeById(token!, id!);
      return response.data;
    },
    enabled: isEdit && !!token && !!id && !stateEmployee,
    staleTime: 30000,
  });

  useEffect(() => {
    if (employeeData && !stateEmployee) {
      setName(employeeData.name || '');
      setEmail(employeeData.email || '');
      setPhone(employeeData.phone || '');
      setDepartment(employeeData.department || '');
      setSelectedProperties(employeeData.assignedProperties || []);
      setSelectedAgents(employeeData.assignedAgents || []);
    }
  }, [employeeData, stateEmployee]);

  const createMutation = useMutation({
    mutationFn: (data: any) => adminAPI.createEmployee(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Employee created successfully');
      navigate('/admin/employees');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminAPI.updateEmployee(token!, id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-employees'] });
      queryClient.invalidateQueries({ queryKey: ['admin-employee', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success('Employee updated successfully');
      navigate('/admin/employees');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !department) {
      toast.error('Please fill all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (isEdit) {
      const sourceData = stateEmployee || employeeData;
      const originalProperties = sourceData?.assignedProperties?.map((p: any) => p.id) || [];
      const originalAgents = sourceData?.assignedAgents?.map((a: any) => a.id) || [];
      const currentProperties = selectedProperties.map((p) => p.id);
      const currentAgents = selectedAgents.map((a) => a.id);

      updateMutation.mutate({
        name,
        email,
        phone,
        department,
        addProperties: currentProperties.filter((id: string) => !originalProperties.includes(id)),
        removeProperties: originalProperties.filter((id: string) => !currentProperties.includes(id)),
        addAgents: currentAgents.filter((id: number) => !originalAgents.includes(id)),
        removeAgents: originalAgents.filter((id: number) => !currentAgents.includes(id)),
      });
    } else {
      createMutation.mutate({
        name,
        email,
        phone,
        department,
        assignProperties: selectedProperties.map((p) => p.id),
        assignAgents: selectedAgents.map((a) => a.id),
        invite: false,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen pb-8">
      {/* Header - Static */}
      <header className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 shadow-lg border-b border-border/50 sticky top-0 z-20">
        <button
          onClick={() => navigate('/admin/employees')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">
          {isEdit ? 'Edit Employee' : 'Create Employee'}
        </h1>
        <div className="w-9 sm:w-10" />
      </header>

      {/* Content */}
      <div className="px-4 sm:px-6 mt-4 sm:mt-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Information */}
            <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Employee Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Department *</label>
                  <button
                    type="button"
                    onClick={() => setShowDeptPicker(true)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-left flex items-center justify-between text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <span className={department ? 'text-foreground' : 'text-muted-foreground'}>
                      {department || 'Select department'}
                    </span>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Assignments</h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowPropertiesModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#0a66c2]/10 text-[#0a66c2] rounded-lg hover:bg-[#0a66c2]/20 transition-colors"
                >
                  <Building2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold">
                    Assign Properties ({selectedProperties.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAgentsModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#00a699]/10 text-[#00a699] rounded-lg hover:bg-[#00a699]/20 transition-colors"
                >
                  <Briefcase className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base font-semibold">
                    Assign Agents ({selectedAgents.length})
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Employee' : 'Create Employee'}</span>
              )}
            </button>
          </form>
      </div>

      {/* Department Picker Modal */}
      {showDeptPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeptPicker(false)}>
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setDepartment(dept);
                    setShowDeptPicker(false);
                  }}
                  className="w-full px-4 py-3 text-left text-foreground hover:bg-muted rounded-lg transition-colors text-sm sm:text-base"
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Property Selection Modal */}
      <MultiSelectModal
        visible={showPropertiesModal}
        title="Select Properties"
        type="properties"
        selected={selectedProperties}
        onClose={() => setShowPropertiesModal(false)}
        onConfirm={setSelectedProperties}
      />

      {/* Agent Selection Modal */}
      <MultiSelectModal
        visible={showAgentsModal}
        title="Select Agents"
        type="agents"
        selected={selectedAgents}
        onClose={() => setShowAgentsModal(false)}
        onConfirm={setSelectedAgents}
      />
    </div>
  );
};
