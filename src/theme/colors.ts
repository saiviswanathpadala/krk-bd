// Premium real estate color palette - Trust, Luxury, Professionalism
// Inspired by Zillow, Sotheby's, Christie's Real Estate

export const colors = {
  // Primary colors
  primary: {
    navy: '#1e293b',        // Deep Navy - Trust & Authority
    navyLight: '#334155',
    navyDark: '#0f172a',
    gold: '#c9a961',        // Muted Gold - Subtle Luxury
    goldLight: '#d4b574',
    goldDark: '#a68a4d',
    blue: '#0891b2',        // Teal Blue - Modern & Clean
    blueLight: '#06b6d4',
    blueDark: '#0e7490',
    orange: '#f97316',      // Orange - Energy & Action
    olive: '#84cc16',       // Olive Green - Growth & Success
    white: '#ffffff',
    offWhite: '#f8fafc',
  },
  
  // Semantic colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
    error: '#ef4444',
    success: '#10b981',
  },
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    gradient: {
      start: '#0f172a',
      middle: '#1e293b',
      end: '#334155',
    },
  },
  
  // Border colors
  border: {
    default: '#e2e8f0',
    focus: '#d4af37',
    error: '#ef4444',
  },
  
  // Shadow colors
  shadow: {
    light: 'rgba(15, 23, 42, 0.05)',
    medium: 'rgba(15, 23, 42, 0.1)',
    heavy: 'rgba(15, 23, 42, 0.15)',
  },
};

// Dark theme colors (for future implementation)
export const darkColors = {
  ...colors,
  // TODO: Implement dark theme variants when needed
};
