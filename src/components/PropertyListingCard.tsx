import React from 'react';
import { MapPin, Eye, FileText, Globe } from 'lucide-react';

export interface PropertyListing {
  id: string;
  title: string;
  location: string;
  price: string | null;
  images: string[];
  gallery?: string[];
  description: string | null;
  categories: string[];
  brochureUrl?: string | null;
  website?: string | null;
  createdAt: string;
  type?: string;
}

interface PropertyListingCardProps {
  property: PropertyListing;
  onViewDetails?: (id: string) => void;
  onShare?: (id: string) => void;
  showNewBadge?: boolean;
}

export const PropertyListingCard: React.FC<PropertyListingCardProps> = ({
  property,
  onViewDetails,
  onShare,
  showNewBadge = true,
}) => {
  const formatPrice = (price: string | null) => {
    if (!price) return 'Price on Request';
    const numPrice = parseFloat(price);
    return `₹${numPrice.toLocaleString('en-IN')}`;
  };

  // Check if property is new (created within last 30 days)
  const isNewListing = showNewBadge && property.createdAt ? 
    (new Date().getTime() - new Date(property.createdAt).getTime()) < (30 * 24 * 60 * 60 * 1000) 
    : false;

  // Get first image
  const imageUrl = property.images?.[0] || property.gallery?.[0] || 'https://via.placeholder.com/400x300?text=Property';

  // Show first 3 categories + "+X more"
  const displayCategories = property.categories?.slice(0, 3) || [];
  const remainingCount = (property.categories?.length || 0) - displayCategories.length;

  // Extract neighborhood from location (first part before comma)
  const neighborhood = property.location?.split(',')[0] || '';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-[420px] mx-auto">
      {/* Image Section with Overlays */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Property';
          }}
        />
        
        {/* New Listing Badge - Always visible for now */}
        <div className="absolute top-2 left-2 bg-black px-7 py-1 rounded-[35px] z-10 flex items-center justify-center">
          <span className="text-white text-xs font-medium">New Listing</span>
        </div>

      </div>

      {/* Property Details */}
      <div className="p-4 md:p-5 space-y-4">
        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-1">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 line-clamp-1">
              {property.location}
            </p>
            {neighborhood && (
              <p className="text-xs text-gray-500 mt-0.5">
                {neighborhood}
              </p>
            )}
          </div>
        </div>

        {/* Category Tags */}
        {displayCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {displayCategories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-black rounded-full text-xs font-medium border border-blue-100"
              >
                {category}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                +{remainingCount} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {property.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            {property.description}
          </p>
        )}

        {/* Action Row */}
        <div className="space-y-2 pt-2">
          {/* View Details Button */}
          <button
            onClick={() => onViewDetails?.(property.id)}
            className="w-full py-3 px-4 bg-black hover:bg-gray-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>

          {/* Icon Buttons Row */}
          <div className="flex items-center justify-center gap-4">
            {property.brochureUrl && (
              <a
                href={property.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-colors group"
                title="Download Brochure"
              >
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Brochure</span>
              </a>
            )}
            {property.website && (
              <a
                href={property.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-colors group"
                title="Visit Website"
              >
                <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Website</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

