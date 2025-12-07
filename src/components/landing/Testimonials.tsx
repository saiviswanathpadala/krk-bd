import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { colors, spacing, borderRadius } from '../../theme';

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Homeowner',
    avatar: 'RK',
    quote: 'Found my dream home in just 2 weeks! The agent was professional and the process was seamless.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Property Investor',
    avatar: 'PS',
    quote: 'Excellent platform for property investment. Market insights helped me make informed decisions.',
    rating: 5,
  },
  {
    name: 'Amit Patel',
    role: 'First-time Buyer',
    avatar: 'AP',
    quote: 'The team guided me through every step. Made my first property purchase stress-free and easy.',
    rating: 5,
  },
];

export const Testimonials: React.FC = () => {
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
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: colors.primary.goldDark, fontWeight: 600 }}>TESTIMONIALS</span>
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
            What Our Clients Say
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: colors.text.secondary, lineHeight: 1.65, padding: '0 1rem' }}>
            Real stories from satisfied homeowners
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 'clamp(1rem, 2.5vw, 1.5rem)',
          }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: '16px',
                padding: 'clamp(1.25rem, 3vw, 2rem)',
                position: 'relative',
                border: `2px solid ${colors.border.default}`,
                boxShadow: `0 4px 16px ${colors.shadow.light}`,
              }}
            >
              <Quote size={40} color={colors.primary.gold} style={{ opacity: 0.12, marginBottom: spacing.md }} />
              <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.md }}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={18} fill={colors.primary.gold} color={colors.primary.gold} />
                ))}
              </div>
              <p
                style={{
                  fontSize: 'clamp(13px, 1.8vw, 15px)',
                  color: colors.text.primary,
                  lineHeight: 1.6,
                  marginBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)',
                }}
              >
                "{testimonial.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <img
                  src={`https://i.pravatar.cc/150?img=${index + 10}`}
                  alt={testimonial.name}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: `2px solid ${colors.border.default}`,
                    objectFit: 'cover',
                  }}
                />
                <div>
                  <div style={{ fontSize: 'clamp(13px, 1.8vw, 15px)', fontWeight: 600, color: colors.text.primary }}>
                    {testimonial.name}
                  </div>
                  <div style={{ fontSize: 'clamp(11px, 1.6vw, 13px)', color: colors.text.secondary }}>
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            marginTop: 'clamp(2rem, 4vw, 3rem)',
            padding: 'clamp(1.5rem, 3vw, 2.5rem)',
            background: `linear-gradient(135deg, ${colors.primary.navy}, ${colors.primary.navyLight})`,
            borderRadius: '20px',
            boxShadow: `0 8px 32px ${colors.shadow.heavy}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: 'clamp(1rem, 3vw, 2rem)',
              flexWrap: 'wrap',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 800, color: colors.primary.goldLight, marginBottom: '0.25rem' }}>10K+</div>
              <div style={{ fontSize: 'clamp(12px, 1.8vw, 15px)', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Happy Clients</div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 800, color: colors.primary.goldLight, marginBottom: '0.25rem' }}>2000+</div>
              <div style={{ fontSize: 'clamp(12px, 1.8vw, 15px)', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Properties Listed</div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 800, color: colors.primary.goldLight, marginBottom: '0.25rem' }}>500+</div>
              <div style={{ fontSize: 'clamp(12px, 1.8vw, 15px)', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Expert Agents</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
