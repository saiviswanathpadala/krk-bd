import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { colors, spacing, borderRadius } from '../../theme';

interface CTAProps {
  onLoginClick: () => void;
}

export const CTA: React.FC<CTAProps> = ({ onLoginClick }) => {
  return (
    <section
      style={{
        padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)",
        backgroundColor: colors.background.secondary,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          background: `linear-gradient(135deg, ${colors.primary.navy}, ${colors.primary.navyLight})`,
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 4vw, 3rem)',
          textAlign: 'center',
          boxShadow: `0 12px 48px ${colors.shadow.heavy}`,
          border: `2px solid ${colors.primary.gold}30`,
        }}
      >
        <div style={{ display: 'inline-block', padding: 'clamp(4px, 1vw, 6px) clamp(12px, 2vw, 16px)', backgroundColor: `${colors.primary.gold}15`, borderRadius: '24px', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
          <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: colors.primary.goldLight, fontWeight: 600 }}>✨ START YOUR JOURNEY</span>
        </div>
        <h2
          style={{
            fontSize: 'clamp(24px, 6vw, 48px)',
            fontWeight: 800,
            color: colors.text.inverse,
            marginBottom: 'clamp(0.75rem, 1.5vw, 1rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Ready to Find Your <span style={{ color: colors.primary.gold }}>Dream Home?</span>
        </h2>
        <p
          style={{
            fontSize: 'clamp(14px, 2vw, 18px)',
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 1.7,
            maxWidth: '700px',
            margin: '0 auto',
            marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)',
            padding: '0 1rem',
          }}
        >
          Join thousands of satisfied homeowners who found their perfect property with Kreddy King
        </p>
        <Button
          onClick={onLoginClick}
          size="lg"
          style={{
            backgroundColor: colors.primary.gold,
            color: colors.primary.navy,
            fontSize: 'clamp(14px, 2vw, 16px)',
            padding: 'clamp(0.875rem, 2vw, 1.125rem) clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            boxShadow: `0 8px 32px ${colors.primary.gold}35`,
          }}
        >
          Get Started Free
          <ArrowRight className="size-5" />
        </Button>
      </motion.div>
    </section>
  );
};
