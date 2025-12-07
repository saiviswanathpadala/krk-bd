import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Briefcase, Users } from 'lucide-react';
import { colors, spacing, borderRadius } from '../../theme';

const roles = [
  {
    icon: Shield,
    title: 'Admin',
    description: 'Complete control over properties, users, and analytics',
    features: ['User management', 'Property oversight', 'Analytics dashboard', 'Loan approvals'],
    gradient: colors.primary.navy,
  },
  {
    icon: Briefcase,
    title: 'Employee',
    description: 'Manage properties and assist customers efficiently',
    features: ['Property management', 'Customer support', 'Banner updates', 'Agent coordination'],
    gradient: colors.primary.orange,
  },
  {
    icon: Users,
    title: 'Agent',
    description: 'Connect with clients and close deals faster',
    features: ['Property listings', 'Client chat', 'Loan assistance', 'Commission tracking'],
    gradient: colors.primary.olive,
  },
];

export const Roles: React.FC = () => {
  return (
    <section
      style={{
        padding: `${spacing['4xl']} ${spacing.xl}`,
        backgroundColor: colors.background.primary,
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: spacing['4xl'] }}
        >
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: colors.primary.navy,
              marginBottom: spacing.md,
            }}
          >
            Built for every role
          </h2>
          <p style={{ fontSize: '18px', color: colors.text.secondary }}>
            Tailored experiences for admins, employees, and agents
          </p>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: spacing.xl,
          }}
        >
          {roles.map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -8 }}
              style={{
                backgroundColor: colors.background.primary,
                borderRadius: borderRadius.xl,
                overflow: 'hidden',
                border: `1px solid ${colors.border.default}`,
                boxShadow: `0 4px 16px ${colors.shadow.light}`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 0.84, 0.3, 1)',
              }}
            >
              <div
                style={{
                  background: role.gradient,
                  padding: spacing.xl,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <role.icon size={32} color={colors.text.inverse} />
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: colors.text.inverse,
                    margin: 0,
                  }}
                >
                  {role.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                    margin: 0,
                  }}
                >
                  {role.description}
                </p>
              </div>
              <div style={{ padding: spacing.xl }}>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                  }}
                >
                  {role.features.map((feature, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        fontSize: '14px',
                        color: colors.text.secondary,
                      }}
                    >
                      <span style={{ color: colors.primary.olive, fontSize: '16px' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
