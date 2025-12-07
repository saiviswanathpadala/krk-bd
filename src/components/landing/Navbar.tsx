import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { colors, spacing } from '../../theme';
import logoImage from '../../assets/logo.png';

interface NavbarProps {
  onLoginClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0, height: scrolled ? '64px' : '72px' }}
      transition={{ duration: 0.3, ease: [0.16, 0.84, 0.3, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : colors.background.primary,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? `0 2px 16px ${colors.shadow.light}` : 'none',
        borderBottom: scrolled ? `1px solid ${colors.border.default}` : 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 0.84, 0.3, 1)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `0 clamp(${spacing.md}, 3vw, ${spacing.xl})`,
          height: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <img
            src={logoImage}
            alt="Maruthi Logo"
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
            }}
          />
          <h1
            style={{
              fontSize: scrolled ? '18px' : '20px',
              fontWeight: 700,
              color: colors.primary.navy,
              margin: 0,
              transition: 'font-size 0.3s ease',
              letterSpacing: '-0.01em',
            }}
          >
            Maruthi Real Estate
          </h1>
        </div>
        <Button onClick={onLoginClick} size="default" style={{ backgroundColor: colors.primary.gold, color: colors.primary.navy, fontWeight: 600 }}>
          <LogIn className="size-4" />
          Login
        </Button>
      </div>
    </motion.nav>
  );
};
