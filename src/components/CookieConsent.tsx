import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    // Enable analytics, tracking, and all cookies
    if (typeof window !== 'undefined') {
      // Enable Google Analytics or other tracking services here
      // Example: window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    }
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    // Disable non-essential cookies, keep only functional cookies
    if (typeof window !== 'undefined') {
      // Disable analytics and tracking
      // Example: window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      // Clear any existing tracking cookies
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.startsWith('_ga') || name.startsWith('_gid')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
    }
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50"
        >
          <div className="bg-card rounded-xl sm:rounded-2xl shadow-2xl border border-border p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                Welcome to KreddyKing.com!
              </h3>
              <button
                onClick={handleDecline}
                className="p-1 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </button>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
              In order to provide a more relevant experience for you, we use cookies to enable some website functionality. 
              We are committed to transparency, trustworthiness, and honesty in all our interactions. Your privacy and trust are our top priorities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-4 py-2 sm:py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors text-sm"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2 sm:py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md text-sm"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
