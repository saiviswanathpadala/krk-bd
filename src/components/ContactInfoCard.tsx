import React from 'react';
import { User, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface ContactInfoCardProps {
  phone: string;
  email: string | null;
  city: string | null;
  dateOfBirth: string | null;
  isEditing?: boolean;
  onEmailChange?: (value: string) => void;
  onCityChange?: (value: string) => void;
  onDateOfBirthChange?: (value: string) => void;
  formatDate?: (dateString: string | null) => string;
}

export const ContactInfoCard: React.FC<ContactInfoCardProps> = ({
  phone,
  email,
  city,
  dateOfBirth,
  isEditing = false,
  onEmailChange,
  onCityChange,
  onDateOfBirthChange,
  formatDate,
}) => {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
      <div className="flex items-center gap-2 mb-5">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Contact Information</h3>
      </div>
      <div className="space-y-5">
        {/* Phone */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</span>
          </div>
          <p className="text-sm md:text-base font-medium text-gray-900 ml-6">
            {phone}
          </p>
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
          </div>
          {isEditing && onEmailChange ? (
            <input
              type="email"
              value={email || ''}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full ml-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              placeholder="Enter your email"
            />
          ) : (
            <p className="text-sm md:text-base font-medium text-gray-900 ml-6">
              {email || 'Not set'}
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">City</span>
          </div>
          {isEditing && onCityChange ? (
            <input
              type="text"
              value={city || ''}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full ml-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              placeholder="Enter your city"
            />
          ) : (
            <p className="text-sm md:text-base font-medium text-gray-900 ml-6">
              {city || 'Not set'}
            </p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Birth</span>
          </div>
          {isEditing && onDateOfBirthChange ? (
            <input
              type="date"
              value={dateOfBirth || ''}
              onChange={(e) => onDateOfBirthChange(e.target.value)}
              className="w-full ml-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
            />
          ) : (
            <p className="text-sm md:text-base font-medium text-gray-900 ml-6">
              {formatDate ? formatDate(dateOfBirth) : (dateOfBirth || 'Not set')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

