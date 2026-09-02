import { Platform } from 'react-native';

// Two palettes. `science` is the paper-like default (white, black, blue, purple);
// `trine` is the cream/forest/gold brand system. Flip PALETTE to switch.
export const PALETTE = 'trine' as 'science' | 'trine';

const science = {
  bg: '#FFFFFF',        // paper
  card: '#FFFFFF',
  card2: '#F3F4F8',     // inset surface (formula boxes, tracks)
  border: '#E3E5EC',
  text: '#111111',
  dim: '#5B6170',
  faint: '#A2A8B5',
  accent: '#2F3FA8',    // indigo: primary, bars, positive weights
  accent2: '#7C3AED',   // purple: secondary series
  pos: '#2F3FA8',
  neg: '#B91C1C',       // red: negative weights, errors
  warn: '#7C3AED',      // purple: highlights, knobs
  gold: '#7C3AED',
  cream: '#FFFFFF',
  forest: '#2F3FA8',    // primary button / header accent
  ink: '#14162B',       // blue-black
  white: '#FFFFFF',
};

const trine = {
  bg: '#FAF7F2', card: '#FFFFFF', card2: '#F0EDE6', border: '#E6E0D6',
  text: '#1A1A1A', dim: '#7E8C85', faint: '#B8A99A',
  accent: '#1E4D3A', accent2: '#7BA388', pos: '#1E4D3A', neg: '#8B4A2F', warn: '#C9A344', gold: '#D4A84B',
  cream: '#FAF7F2', forest: '#1E4D3A', ink: '#2D4739', white: '#FFFFFF',
};

export const C = PALETTE === 'science' ? science : trine;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// LaTeX-like typography: a serif for text and headings, italic serif for formulas,
// monospace only for code and raw numbers.
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string;
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }) as string;

export const shadow = PALETTE === 'science'
  ? {}
  : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };
