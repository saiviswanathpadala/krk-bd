import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/modals/LoginModal';
import { OTPModal } from '../components/modals/OTPModal';
import { ProfileCompletionModal } from '../components/modals/ProfileCompletionModal';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Testimonials } from '../components/landing/Testimonials';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';
import { CookieConsent } from '../components/CookieConsent';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export const LandingPage: React.FC = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [phone, setPhone] = useState('');
  const { isAuthenticated, isInitialized, user, initializeAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated && user) {
      const userRole = user.role?.toLowerCase();

      if (userRole === 'admin') {
        navigate('/admin/home');
      } else if (userRole === 'employee') {
        if (user.deleted) {
          toast.error('Your account has been deleted. Please contact admin.');
          useAuthStore.getState().clearAuth();
        } else if (!user.active) {
          toast.warning('Your account is pending approval. Please wait for admin activation.');
        } else {
          navigate('/employee/home');
        }
      } else if (userRole === 'agent' && user.approved !== true) {
        navigate('/pending-verification');
      } else if (!user.profileCompleted) {
        setShowProfileModal(true);
      } else {
        navigate('/home');
      }
    }
  }, [isInitialized, isAuthenticated, user, navigate]);

  const handleOTPSent = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setShowLoginModal(false);
    setShowOTPModal(true);
  };

  const handleOTPVerified = (profileCompleted: boolean, user: any) => {
    setShowOTPModal(false);
    if (!profileCompleted) {
      setShowProfileModal(true);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileModal(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navbar onLoginClick={() => setShowLoginModal(true)} />
      <Hero onLoginClick={() => setShowLoginModal(true)} />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA onLoginClick={() => setShowLoginModal(true)} />
      <Footer />
      <CookieConsent />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onOTPSent={handleOTPSent}
      />
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phone={phone}
        onVerified={handleOTPVerified}
      />
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => {}}
        onComplete={handleProfileComplete}
      />
    </div>
  );
};
