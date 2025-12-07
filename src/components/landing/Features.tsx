import React from 'react';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Shield, Headphones } from 'lucide-react';
import { colors, spacing, borderRadius } from '../../theme';

const features = [
  {
    icon: Home,
    title: 'Wide Property Selection',
    description: 'Browse thousands of verified properties across multiple locations',
  },
  {
    icon: TrendingUp,
    title: 'Market Insights',
    description: 'Get real-time market trends and property valuations',
  },
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'All properties are verified for authenticity and legal compliance',
  },
  {
    icon: Headphones,
    title: 'Expert Support',
    description: 'Connect with experienced agents for personalized assistance',
  },
];

export const Features: React.FC = () => {
  return (
    <section
      style={{
        padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)",
        backgroundColor: colors.background.primary,
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
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: colors.primary.goldDark, fontWeight: 600 }}>WHY CHOOSE US</span>
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 5vw, 44px)',
              fontWeight: 800,
              color: colors.primary.navy,
              marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              letterSpacing: '-0.02em',
            }}
          >
            Premium Real Estate Experience
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: colors.text.secondary, maxWidth: '650px', margin: '0 auto', lineHeight: 1.65, padding: '0 1rem' }}>
            Your trusted partner in finding the perfect property with unmatched service and expertise
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 'clamp(1rem, 2.5vw, 1.5rem)',
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: '16px',
                padding: 'clamp(1.25rem, 3vw, 2rem)',
                border: `2px solid ${colors.border.default}`,
                boxShadow: `0 4px 16px ${colors.shadow.light}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${colors.primary.gold}18, ${colors.primary.blue}12)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
                  border: `2px solid ${colors.primary.gold}25`,
                }}
              >
                <feature.icon size={36} color={colors.primary.gold} strokeWidth={2} />
              </div>
              <h3
                style={{
                  fontSize: 'clamp(17px, 2.2vw, 21px)',
                  fontWeight: 700,
                  color: colors.text.primary,
                  marginBottom: spacing.sm,
                  letterSpacing: '-0.01em',
                }}
              >
                {feature.title}
              </h3>
              <p style={{ fontSize: 'clamp(13px, 1.8vw, 15px)', color: colors.text.secondary, lineHeight: 1.7 }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
