import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { colors, spacing } from '../../theme';
import logoImage from '../../assets/logo.png';

const footerLinks = {
  company: [
    { label: 'About Us', href: '#' },
    { label: 'Org Team', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  // properties: [
  //   { label: 'Buy Property', href: '#' },
  //   { label: 'Sell Property', href: '#' },
  //   { label: 'Rent Property', href: '#' },
  // ],
  resources: [
    { label: 'AI Assistance', href: '#' },
    { label: 'Instant Loan Assistance', href: '#' },
    { label: 'Schedule Property Visits', href: '#' },
    { label: 'Agents Support', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
];

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: colors.primary.navy,
        color: colors.text.inverse,
        padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem)",
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Main Footer Content */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: spacing['2xl'],
            marginBottom: spacing['4xl'],
          }}
        >
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
              <img
                src={logoImage}
                alt="Kreddy King Logo"
                style={{
                  width: 'clamp(36px, 5vw, 40px)',
                  height: 'clamp(36px, 5vw, 40px)',
                  objectFit: 'contain',
                }}
              />
              <span style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', fontWeight: 700, letterSpacing: '-0.01em' }}>Kreddy King</span>
            </div>
            <p style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.7, marginBottom: spacing.lg }}>
              Your trusted partner in finding the perfect property across India
            </p>
            <div style={{ display: 'flex', gap: spacing.md }}>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <social.icon size={18} color={colors.text.inverse} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3
                style={{
                  fontSize: 'clamp(15px, 2vw, 16px)',
                  fontWeight: 700,
                  marginBottom: spacing.lg,
                  textTransform: 'capitalize',
                  letterSpacing: '-0.01em',
                }}
              >
                {category}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      style={{
                        fontSize: 'clamp(13px, 1.8vw, 14px)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.primary.goldLight;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div
          style={{
            padding: spacing.xl,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            marginBottom: spacing.xl,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: spacing.lg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <Mail size={18} color={colors.primary.goldLight} />
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'rgba(255, 255, 255, 0.85)' }}>info@kreddyking.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <Phone size={18} color={colors.primary.goldLight} />
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'rgba(255, 255, 255, 0.85)' }}>+91-8448448599</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <MapPin size={18} color={colors.primary.goldLight} />
              <span style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'rgba(255, 255, 255, 0.85)' }}>Gachibowli,Hyderabad,Telangana</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: spacing.xl,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          <p style={{ fontSize: 'clamp(12px, 1.8vw, 14px)', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            © {new Date().getFullYear()} Kreddy King. All rights reserved.
          </p>
          <p style={{ fontSize: 'clamp(12px, 1.8vw, 14px)', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            Made with ❤️ in India
          </p>
        </div>
      </div>
    </footer>
  );
};
