// Design system colors for HaMaaser mobile app
// Based on design-reference.md from specs/001-mvp-platform-spec

export const colors = {
  // Primary brand colors
  primary: '#d4a373',         // Terracotta/Soft Gold - main brand color
  secondary: '#eebd2b',       // Bright Gold - energetic accent
  accent: '#E87A5D',          // Coral - donation/CTA color
  info: '#A0DDE6',            // Soft Teal - informational elements
  
  // Semantic colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  
  // Neutral colors
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },
  
  // Border and divider
  border: '#E0E0E0',
  divider: '#EEEEEE',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
} as const;

export type ColorKey = keyof typeof colors;
