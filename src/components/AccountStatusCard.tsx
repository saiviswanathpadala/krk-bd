import React from 'react';
import { Shield, Clock } from 'lucide-react';

interface AccountStatusCardProps {
  profileCompleted: boolean;
  active: boolean;
  approved: boolean;
}

export const AccountStatusCard: React.FC<AccountStatusCardProps> = ({
  profileCompleted,
  active,
  approved,
}) => {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Account Status</h3>
      </div>
      <div className="space-y-5">
        {/* Profile Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile Status</span>
          </div>
          <span className={`inline-block ml-6 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium ${
            profileCompleted 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {profileCompleted ? 'Complete' : 'Incomplete'}
          </span>
        </div>

        {/* Account Active */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Active</span>
          </div>
          <span className={`inline-block ml-6 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium ${
            active 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Approval Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Approval Status</span>
          </div>
          <span className={`inline-block ml-6 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium ${
            approved !== false
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {approved !== false ? 'Approved' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};

