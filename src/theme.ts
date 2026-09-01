// Trine design system tokens (from constants/colors.ts and the Trine Design System kit).
// Cream is the room, white cards are the furniture, forest does the work, gold is decorative.
export const C = {
  bg: '#FAF7F2',        // cream canvas
  card: '#FFFFFF',      // card surface
  card2: '#F0EDE6',     // inset surface / pill background
  border: '#E6E0D6',    // cream-warm divider
  text: '#1A1A1A',      // charcoal body text
  dim: '#7E8C85',       // mist: secondary labels
  faint: '#B8A99A',     // muted tertiary
  accent: '#1E4D3A',    // forest: primary, headings, bars
  accent2: '#7BA388',   // deep sage: secondary series
  pos: '#1E4D3A',       // positive weight = forest
  neg: '#8B4A2F',       // negative weight = terracotta
  warn: '#C9A344',      // gold ink on cream: highlights, learning-rate knobs
  gold: '#D4A84B',      // decorative gold (✦, glow)
  cream: '#FAF7F2',
  forest: '#1E4D3A',
  ink: '#2D4739',
  white: '#FFFFFF',
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const mono = 'Menlo';
export const serif = 'Georgia';   // stand-in for Cormorant Garamond, as in the Trine app

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};
