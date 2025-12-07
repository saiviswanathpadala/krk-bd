import React from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, Key } from 'lucide-react';
import { colors, spacing } from '../../theme';

const steps = [
  {
    icon: Search,
    title: 'Search Properties',
    description: 'Browse our extensive collection of verified properties',
  },
  {
    icon: UserCheck,
    title: 'Connect with Agent',
    description: 'Get matched with expert agents for personalized guidance',
  },
  {
    icon: Key,
    title: 'Close the Deal',
    description: 'Complete documentation and move into your dream home',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section
      style={{
        padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)",
        backgroundColor: colors.background.secondary,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}
        >
          <div style={{ display: 'inline-block', padding: 'clamp(4px, 1vw, 6px) clamp(12px, 2vw, 16px)', backgroundColor: `${colors.primary.gold}12`, borderRadius: '24px', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: colors.primary.goldDark, fontWeight: 600 }}>SIMPLE PROCESS</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 5vw, 44px)',
              fontWeight: 800,
              color: colors.primary.navy,
              marginBottom: spacing.md,
              letterSpacing: '-0.02em',
            }}
          >
            How It Works
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: colors.text.secondary, lineHeight: 1.65, padding: '0 1rem' }}>
            Three simple steps to your dream property
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 'clamp(1rem, 2.5vw, 1.5rem)',
          }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              style={{
                position: 'relative',
                textAlign: 'center',
                padding: 'clamp(1.25rem, 3vw, 2rem)',
                backgroundColor: colors.background.primary,
                borderRadius: '16px',
                border: `2px solid ${colors.border.default}`,
                boxShadow: `0 4px 16px ${colors.shadow.light}`,
              }}
            >
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.primary.gold}, ${colors.primary.goldDark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
                  position: 'relative',
                  boxShadow: `0 8px 24px ${colors.primary.gold}30`,
                }}
              >
                <step.icon size={40} color={colors.primary.navy} strokeWidth={2.5} />
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary.navy,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: colors.primary.gold,
                    border: `3px solid ${colors.background.primary}`,
                  }}
                >
                  {index + 1}
                </div>
              </div>
              <h3
                style={{
                  fontSize: 'clamp(18px, 2.5vw, 22px)',
                  fontWeight: 700,
                  color: colors.text.primary,
                  marginBottom: spacing.sm,
                  letterSpacing: '-0.01em',
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: 'clamp(13px, 1.8vw, 15px)', color: colors.text.secondary, lineHeight: 1.7 }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
