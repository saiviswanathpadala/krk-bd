import React from 'react';
import { Gem, Home, Building, TreePine, Hotel, Factory } from 'lucide-react';

interface PropertyCategoriesProps {
  categories: string[];
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'farmhouse': TreePine,
  'Farmhouse': TreePine,
  'apartment': Building,
  'Apartment': Building,
  'flat': Building,
  'Flat': Building,
  'villa': Home,
  'Villa': Home,
  'house': Home,
  'House': Home,
  'hotel': Hotel,
  'Hotel': Hotel,
  'commercial': Factory,
  'Commercial': Factory,
};

const getCategoryIcon = (category: string) => {
  const Icon = categoryIcons[category] || Gem;
  return Icon;
};

export const PropertyCategories: React.FC<PropertyCategoriesProps> = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl md:rounded-2xl shadow-md p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gem className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg md:text-xl font-semibold text-gray-900">Preferred Property Categories</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {categories.map((category, index) => {
          const Icon = getCategoryIcon(category);
          return (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <Icon className="w-5 h-5 text-blue-600" />
              <span className="text-sm md:text-base font-medium text-gray-900">
                {category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

