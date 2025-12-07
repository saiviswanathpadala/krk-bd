import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Image as ImageIcon, Tag, ExternalLink, FileText, Eye } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  location: string;
  price?: string | number | null;
  images?: string[];
  description?: string | null;
  features?: string[];
  amenities?: string[];
  categories?: string[];
  brochureUrl?: string | null;
  map?: string | null;
  website?: string | null;
  type?: string;
}

interface PropertyCardProps {
  property: Property;
  index: number;
  onClick?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, index }) => {
  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return 'Price on Request';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Price on Request';
    
    if (numPrice >= 10000000) {
      return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
    } else if (numPrice >= 100000) {
      return `₹${(numPrice / 100000).toFixed(2)} L`;
    } else {
      return `₹${numPrice.toLocaleString('en-IN')}`;
    }
  };

  const mainImage = property.images?.[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-border/50"
    >
      {/* Image Section */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-muted">
        {mainImage ? (
          <img
            src={mainImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Type badge */}
        {property.type && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full shadow-md">
              {property.type}
            </span>
          </div>
        )}
        
        {/* Image count badge */}
        {property.images && property.images.length > 1 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-lg flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {property.images.length}
            </span>
          </div>
        )}
        
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {property.title}
        </h3>
        
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{property.location}</span>
        </div>

        {/* Categories */}
        {property.categories && property.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {property.categories.slice(0, 3).map((category, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-md"
              >
                <Tag className="w-3 h-3" />
                {category}
              </span>
            ))}
            {property.categories.length > 3 && (
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-md">
                +{property.categories.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {property.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {property.description}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* View Details Button - Using Link for proper SPA navigation */}
          <Link
            to={`/property/${property.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl shadow-md transition-all duration-200 ease-out hover:bg-primary/85 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Eye className="w-4 h-4" />
            View Details
          </Link>
          
          {/* Secondary buttons */}
          {(property.brochureUrl || property.website) && (
            <div className="flex gap-2">
              {property.brochureUrl && (
                <a
                  href={property.brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary/10 text-primary rounded-lg shadow-sm transition-all duration-200 ease-out hover:bg-primary/20 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Brochure
                </a>
              )}
              {property.website && (
                <a
                  href={property.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg shadow-sm transition-all duration-200 ease-out hover:bg-secondary/70 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

