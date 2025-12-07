import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Shield, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { adminAPI } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

interface ReferredCustomer {
  id: number;
  name: string | null;
  email: string | null;
  phone: string;
  profileImgUrl: string | null;
}

interface AgentDetails {
  id: number;
  name: string | null;
  email: string | null;
  phone: string;
  city: string | null;
  dateOfBirth: string | null;
  role: string;
  approved: boolean;
  active: boolean;
  profileCompleted: boolean;
  profileImgUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  referredCustomers: ReferredCustomer[];
  assignedEmployeeId: number | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  rejectedAt: string | null;
  referredByAgentId: number | null;
  department: string | null;
  preferredCategories: string[] | null;
}

export const AgentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const { data: agent, isLoading, error } = useQuery<AgentDetails>({
    queryKey: ['agent', id],
    queryFn: async () => {
      const response = await adminAPI.getAgentById(token!, Number(id!));
      // Ensure referredCustomers is always an array and use all data from backend
      const agentData: AgentDetails = {
        ...response.data,
        referredCustomers: Array.isArray(response.data.referredCustomers) 
          ? response.data.referredCustomers 
          : []
      };
      return agentData;
    },
    enabled: !!token && !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-6 px-2 md:px-0">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-6 pb-6 px-2 md:px-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">
          <p>Agent not found or you don't have access to view it.</p>
        </div>
      </div>
    );
  }

  const handleChat = () => {
    // TODO: Implement chat functionality
    console.log('Chat with agent:', agent.id);
  };

  const handleCustomerClick = (customerId: number) => {
    // TODO: Navigate to customer details
    navigate(`/admin/customers/${customerId}`);
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-6 px-2 md:px-0">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Agent Details</h1>
      </div>

      {/* Agent Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
        <div className="flex flex-col items-center text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {agent.name || 'Agent'}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 ${
              agent.approved 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              <CheckCircle className="w-3.5 h-3.5" />
              {agent.approved ? 'Approved' : 'Pending'}
            </span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm font-medium capitalize">
              {agent.role || 'agent'}
            </span>
          </div>
          <button
            onClick={handleChat}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chat with Agent</span>
          </button>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
              <p className="text-sm md:text-base font-medium text-gray-900">{agent.email || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
              <p className="text-sm md:text-base font-medium text-gray-900">{agent.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">City</p>
              <p className="text-sm md:text-base font-medium text-gray-900">{agent.city || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referred Customers Card - Always show */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
          Referred Customers ({Array.isArray(agent.referredCustomers) ? agent.referredCustomers.length : 0})
        </h3>
        {Array.isArray(agent.referredCustomers) && agent.referredCustomers.length > 0 ? (
          <div className="space-y-3">
            {agent.referredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleCustomerClick(customer.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {customer.profileImgUrl ? (
                    <img
                      src={customer.profileImgUrl}
                      alt={customer.name || 'Customer'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=User';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                      {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                    {customer.name || 'Unknown'}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    {customer.email || 'No email'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No referred customers yet.
          </p>
        )}
      </div>

      {/* Account Information Card */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
          Account Information
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Profile Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                agent.profileCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {agent.profileCompleted ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account Active</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                agent.active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {agent.assignedEmployeeId && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Assigned Employee ID</p>
                <p className="text-sm md:text-base font-medium text-gray-900">{agent.assignedEmployeeId}</p>
              </div>
            </div>
          )}

          {agent.approvedAt && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approved At</p>
                <p className="text-sm md:text-base font-medium text-gray-900">
                  {new Date(agent.approvedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

