import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ChevronLeft, ChevronRight, Tag, Check, FileText, ExternalLink, Map } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  location: string;
  price?: string | number | null;
  images?: string[];
  gallery?: string[];
  description?: string | null;
  features?: string[];
  amenities?: string[];
  categories?: string[];
  brochureUrl?: string | null;
  map?: string | null;
  website?: string | null;
  type?: string;
}

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!property) return null;

  const allImages = [...(property.images || []), ...(property.gallery || [])];

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

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-20 bg-card rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground line-clamp-1">
                  {property.title}
                </h2>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{property.location}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6">
                {/* Image Gallery */}
                <div className="space-y-4">
                  {allImages.length > 0 ? (
                    <>
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={currentImageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            src={allImages[currentImageIndex]}
                            alt={`${property.title} - Image ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </AnimatePresence>

                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                              {currentImageIndex + 1} / {allImages.length}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Thumbnails */}
                      {allImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {allImages.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === currentImageIndex
                                  ? 'border-primary'
                                  : 'border-transparent opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground">No images available</p>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                  {/* Price */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(property.price)}
                    </p>
                    {property.type && (
                      <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                        {property.type}
                      </span>
                    )}
                  </div>

                  {/* Categories */}
                  {property.categories && property.categories.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {property.categories.map((category, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-lg"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {property.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        Description
                      </h3>
                      <p className="text-foreground leading-relaxed">
                        {property.description}
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  {property.features && property.features.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        Features
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {property.features.map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {property.amenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    {property.brochureUrl && (
                      <a
                        href={property.brochureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-colors"
                      >
                        <FileText className="w-5 h-5" />
                        Download Brochure
                      </a>
                    )}
                    {property.website && (
                      <a
                        href={property.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl font-medium transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Visit Website
                      </a>
                    )}
                    {property.map && (
                      <a
                        href={property.map}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 border border-border hover:bg-muted rounded-xl font-medium transition-colors"
                      >
                        <Map className="w-5 h-5" />
                        View on Map
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

