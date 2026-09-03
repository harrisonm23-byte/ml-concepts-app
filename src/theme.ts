import { Platform, StyleSheet } from 'react-native';

// Three palettes, switchable at runtime from the header.
export type PaletteName = 'paper' | 'trine' | 'dark';

type Palette = {
  bg: string; card: string; card2: string; border: string;
  text: string; dim: string; faint: string;
  accent: string; accent2: string; pos: string; neg: string; warn: string; gold: string;
  cream: string; forest: string; ink: string; white: string;
  heatLo: [number, number, number]; heatHi: [number, number, number];
  posRGB: string; negRGB: string; onHi: string; onLo: string;
  statusBar: 'light' | 'dark'; shadow: boolean;
};

// Paper: white page and black ink like the course essays; Trine forest, sage and gold for controls and plots.
const paper: Palette = {
  bg: '#FFFFFF', card: '#FFFFFF', card2: '#F4F4F4', border: '#D9D9D9',
  text: '#000000', dim: '#444444', faint: '#9A9A9A',
  accent: '#1E4D3A', accent2: '#7BA388', pos: '#1E4D3A', neg: '#8B4A2F', warn: '#C9A344', gold: '#D4A84B',
  cream: '#FFFFFF', forest: '#1E4D3A', ink: '#2D4739', white: '#FFFFFF',
  heatLo: [240, 240, 240], heatHi: [30, 77, 58], posRGB: '30,77,58', negRGB: '139,74,47', onHi: '#FFFFFF', onLo: '#000000',
  statusBar: 'dark', shadow: false,
};

// Trine: cream room, white furniture, forest does the work, gold is decorative.
const trine: Palette = {
  bg: '#FAF7F2', card: '#FFFFFF', card2: '#F0EDE6', border: '#E6E0D6',
  text: '#1A1A1A', dim: '#7E8C85', faint: '#B8A99A',
  accent: '#1E4D3A', accent2: '#7BA388', pos: '#1E4D3A', neg: '#8B4A2F', warn: '#C9A344', gold: '#D4A84B',
  cream: '#FAF7F2', forest: '#1E4D3A', ink: '#2D4739', white: '#FFFFFF',
  heatLo: [237, 234, 229], heatHi: [30, 77, 58], posRGB: '30,77,58', negRGB: '139,74,47', onHi: '#FAF7F2', onLo: '#1A1A1A',
  statusBar: 'dark', shadow: true,
};

// Dark: the original look; activations read as brightness.
const dark: Palette = {
  bg: '#0e1016', card: '#181b25', card2: '#20242f', border: '#2b3040',
  text: '#e9ecf3', dim: '#9aa3b5', faint: '#5d6577',
  accent: '#5b8def', accent2: '#a78bfa', pos: '#4cc38a', neg: '#ef6b73', warn: '#f5a524', gold: '#f5a524',
  cream: '#ffffff', forest: '#5b8def', ink: '#ffffff', white: '#ffffff',
  heatLo: [30, 40, 70], heatHi: [230, 220, 255], posRGB: '76,195,138', negRGB: '239,107,115', onHi: '#0e1016', onLo: '#e9ecf3',
  statusBar: 'light', shadow: false,
};

export const PALETTES: Record<PaletteName, Palette> = { paper, trine, dark };
export const PALETTE_LABELS: Record<PaletteName, string> = { paper: 'Paper', trine: 'Trine', dark: 'Dark' };

let current: PaletteName = 'paper';
export const currentPalette = () => current;

// C is mutated in place so every `C.x` read at render time sees the active palette.
export const C: Palette = { ...paper };
export function applyPalette(name: PaletteName) {
  current = name;
  Object.assign(C, PALETTES[name]);
}

// Wrap a StyleSheet factory so its colours are re-evaluated per palette (cached per palette).
export function themed<T extends object>(factory: () => T): T {
  const cache: Partial<Record<PaletteName, T>> = {};
  return new Proxy({} as T, {
    get: (_t, k) => {
      if (!cache[current]) cache[current] = factory();
      return (cache[current] as T)[k as keyof T];
    },
  });
}

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// LaTeX-like typography: a serif for text and headings, italic serif for formulas,
// monospace only for code and raw numbers.
export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string;
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }) as string;

export const shadowFor = () =>
  C.shadow ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 } : {};

void StyleSheet;
