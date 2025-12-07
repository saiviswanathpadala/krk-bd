import React from 'react';
import { User, Shield, MapPin, Camera } from 'lucide-react';

interface ProfileBannerProps {
  name: string;
  role: string;
  city: string | null;
  profileImgUrl: string | null;
  isEditing?: boolean;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileBanner: React.FC<ProfileBannerProps> = ({
  name,
  role,
  city,
  profileImgUrl,
  isEditing = false,
  onImageUpload,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
      <div className="flex items-center gap-4 md:gap-6">
        {/* Profile Picture - Left Side */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white overflow-hidden border-2 border-white shadow-lg">
            {profileImgUrl ? (
              <img
                src={profileImgUrl}
                alt={name}
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
          {/* Camera Icon for Changing Picture */}
          {onImageUpload && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-50 z-10 border-2 border-gray-200">
              <Camera className="w-4 h-4 text-gray-600" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
              />
            </label>
          )}
          {/* Green Checkmark Badge */}
          {!onImageUpload && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          )}
        </div>
        
        {/* Profile Details - Right Side */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
            {name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs md:text-sm capitalize flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5" />
              {role}
            </span>
            {city && (
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs md:text-sm flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {city}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

