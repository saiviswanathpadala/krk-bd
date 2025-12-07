import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import { userAPI, adminAPI } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

interface CustomerDetails {
  id: number;
  name: string | null;
  email: string | null;
  phone: string;
  city: string | null;
  dateOfBirth: string | null;
  profileImgUrl: string | null;
  profileCompleted: boolean;
  role: string;
  active: boolean;
  approved: boolean;
  preferredCategories: string[] | null;
  createdAt: string;
  updatedAt: string;
  referredByAgentId: number | null;
}

export const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  // Try user endpoint first (for agents), fallback to admin endpoint
  const { data: customerResponse, isLoading, error } = useQuery<CustomerDetails | { customer: CustomerDetails }>({
    queryKey: ['customer', id],
    queryFn: async () => {
      // If user is an agent, try user endpoint first
      if (user?.role?.toLowerCase() === 'agent') {
        try {
          const response = await userAPI.getReferredCustomerById(token!, id!);
          return response.data;
        } catch {
          // Fallback to admin endpoint
          const response = await adminAPI.getCustomerById(token!, id!);
          return response.data;
        }
      } else {
        // For admin/employee, use admin endpoint
        const response = await adminAPI.getCustomerById(token!, id!);
        return response.data;
      }
    },
    enabled: !!token && !!id,
  });

  // Handle both response formats: direct customer object or { customer: ... }
  const customer = (customerResponse as any)?.customer || customerResponse as CustomerDetails;

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

  if (error || !customer) {
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
          <p>Customer not found or you don't have access to view it.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-6 px-2 md:px-0 max-w-4xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Customer Details</h1>
      </div>

      {/* Customer Header Section */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
        <div className="flex items-center gap-4">
          {/* Profile Picture - Left Side */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white overflow-hidden border-2 border-gray-200 shadow-lg">
              {customer.profileImgUrl ? (
                <img
                  src={customer.profileImgUrl}
                  alt={customer.name || 'Customer'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=User';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            {/* Green Checkmark Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Customer Details - Right Side */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {customer.name || 'Customer'}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium ${
                customer.approved 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {customer.approved ? 'Approved' : 'Pending'}
              </span>
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm font-medium capitalize">
                {customer.role || 'customer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information and Account Information - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                <p className="text-sm md:text-base font-medium text-gray-900">{customer.email || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                <p className="text-sm md:text-base font-medium text-gray-900">{customer.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">City</p>
                <p className="text-sm md:text-base font-medium text-gray-900">{customer.city || 'Not set'}</p>
              </div>
            </div>

            {customer.dateOfBirth && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date of Birth</p>
                  <p className="text-sm md:text-base font-medium text-gray-900">{formatDate(customer.dateOfBirth)}</p>
                </div>
              </div>
            )}
          </div>
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
                  customer.profileCompleted 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {customer.profileCompleted ? 'Complete' : 'Incomplete'}
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
                  customer.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {customer.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {customer.preferredCategories && customer.preferredCategories.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Preferred Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.preferredCategories.map((category: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {customer.referredByAgentId && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Referred By Agent ID</p>
                  <p className="text-sm md:text-base font-medium text-gray-900">{customer.referredByAgentId}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                <p className="text-sm md:text-base font-medium text-gray-900">
                  {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

