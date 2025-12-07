import { colors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';

export { colors, darkColors, typography, spacing, borderRadius };

// Combined theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
};

export type Theme = typeof theme;
