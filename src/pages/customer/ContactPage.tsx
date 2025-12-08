import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Phone, 
  Mail,
  ArrowLeft,
  Home,
  Clock,
  ShieldCheck,
  ArrowRight,
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
}

const CompanyDetailsSkeleton = () => (
  <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 md:p-6 shadow-sm animate-pulse">
    <Skeleton className="h-7 sm:h-8 w-3/4 mb-3 sm:mb-4" />
    <Skeleton className="h-5 sm:h-6 w-32 sm:w-40 mb-2" />
    <Skeleton className="h-4 sm:h-5 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-5/6 mb-4" />
    <div className="h-px bg-border my-4" />
    {[1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    ))}
  </div>
);

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const getHomePath = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin') return '/admin/home';
    if (role === 'employee') return '/employee/home';
    return '/home';
  };

  const companyInfo = {
    companyName: 'Kreddy King',
    tagline: 'The Best Premium Villa Houses & a better living environment',
    description: 'Established in 1994 by Dr. K. Ram Reddy, a Macro economist serving as Chairman and managing Director, Kreddy King embarked on its real estate journey with a visionary focus on the burgeoning growth of Hyderabad. Driven by his passion for real estate, meticulous planning, attention to detail, and foresight, Kreddy King has experienced manifold growth under his leadership.',
    phone: '+91 8448448599',
    email: 'sales@kreddyking.com'
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Loading state
  if (isLoadingCategories) {
    return (
      <div className="min-h-screen pb-8">
        {/* Header Skeleton */}
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-7 w-40 sm:w-48" />
          <div className="w-9 sm:w-10" />
        </div>

        <div className="px-4 sm:px-6 max-w-4xl mx-auto">
          <CompanyDetailsSkeleton />
          <div className="mt-4">
            <Skeleton className="h-48 sm:h-56 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-0"
    >
      {/* Header - matching employee pages style */}
      <motion.div variants={itemVariants}>
        <div className="bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-4 shadow-lg border-b border-border/50 sticky top-0 z-20 mb-6">
          <button
            onClick={() => navigate(getHomePath())}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </button>
          <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-foreground">Get in Touch</h1>
          <div className="w-9 sm:w-10" />
        </div>
      </motion.div>

      <div className="px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Company Information Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-5 md:p-6 shadow-sm overflow-hidden relative">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            <div className="relative">
              {/* Company Name */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 sm:mb-4">
                {companyInfo.companyName}
              </h2>

              {/* About Company Section */}
              <div className="mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2">
                  About Company
                </h3>
                <p className="text-primary font-medium mb-2 sm:mb-3 text-sm sm:text-base md:text-lg">
                  {companyInfo.tagline}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                  {companyInfo.description}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-border my-4 sm:my-5" />

              {/* Contact Information */}
              <div className="space-y-3 sm:space-y-4">
                {/* Phone */}
                <a 
                  href={`tel:${companyInfo.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide mb-0.5 sm:mb-1">Enquiry</p>
                    <p className="text-foreground font-semibold text-sm sm:text-base md:text-lg">{companyInfo.phone}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Email */}
                <a 
                  href={`mailto:${companyInfo.email}`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide mb-0.5 sm:mb-1">Email</p>
                    <p className="text-foreground font-semibold text-sm sm:text-base md:text-lg break-words">{companyInfo.email}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loan Assistance Card - Only for customers */}
        {user?.role?.toLowerCase() === 'customer' && (
          <motion.div variants={itemVariants} className="mt-4 sm:mt-6">
            <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden shadow-sm relative">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 pointer-events-none" />
              
              <div className="relative p-4 sm:p-5 md:p-6">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full mb-3 sm:mb-4">
                    <Home className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">
                    Need Property Financing?
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                    Get expert loan assistance with competitive rates from our trusted banking partners
                  </p>
                </div>

                {/* Stats */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-4 sm:mb-5 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm sm:text-base font-semibold text-foreground">24-48 hrs response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="text-sm sm:text-base font-semibold text-foreground">100% secure process</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    navigate('/loan-assistance');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm sm:text-base shadow-lg transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Building2 className="w-5 h-5" />
                  Request Loan Assistance
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
