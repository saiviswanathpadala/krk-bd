import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

interface PropertyCardProps {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  onViewDetails?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  name,
  location,
  imageUrl,
  onViewDetails,
}) => {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md overflow-hidden">
      {/* Property Image */}
      <div className="relative h-40 md:h-48 lg:h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Property';
          }}
        />
      </div>

      {/* Property Details */}
      <div className="p-3 md:p-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{name}</h3>
        
        <div className="flex items-start gap-2 text-gray-600 mb-3 md:mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
          <p className="text-xs md:text-sm line-clamp-2">{location}</p>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails?.(id)}
          className="w-full py-2.5 md:py-3 px-3 md:px-4 bg-black hover:bg-gray-800 text-white font-medium rounded-full flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

