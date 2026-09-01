export const softmax = (z: number[], T = 1): number[] => {
  const scaled = z.map((v) => v / T);
  const m = Math.max(...scaled);
  const e = scaled.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};

export const relu = (x: number) => Math.max(0, x);
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const tanh = (x: number) => Math.tanh(x);

export const argmax = (a: number[]) =>
  a.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0);

export const sampleIndex = (p: number[], rnd = Math.random()) => {
  let acc = 0;
  for (let i = 0; i < p.length; i++) {
    acc += p[i];
    if (rnd < acc) return i;
  }
  return p.length - 1;
};

export const entropy = (p: number[]) =>
  -p.reduce((s, v) => (v > 0 ? s + v * Math.log(v) : s), 0);

export const dot = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + v * b[i], 0);

export const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x));

export const fmt = (x: number, d = 2) => {
  if (!isFinite(x)) return '∞';
  const s = x.toFixed(d);
  return s === '-0.00' ? '0.00' : s;
};

// Deterministic PRNG so "random" weights are stable between renders.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hashStr = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// A stable pseudo-embedding for any string: d numbers in [-1, 1].
export const pseudoEmbedding = (token: string, d = 8): number[] => {
  const rnd = mulberry32(hashStr(token));
  return Array.from({ length: d }, () => rnd() * 2 - 1);
};

// Colour for a signed value in [-1, 1]: red negative, green positive, dark near zero.
export const signedColor = (v: number, max = 1) => {
  const t = clamp(Math.abs(v) / max, 0, 1);
  const a = 0.15 + 0.85 * t;
  return v >= 0 ? `rgba(76,195,138,${a.toFixed(2)})` : `rgba(239,107,115,${a.toFixed(2)})`;
};

// Colour for an unsigned activation in [0, 1]: dark to bright blue-white.
export const heatColor = (v: number) => {
  const t = clamp(v, 0, 1);
  const r = Math.round(30 + 200 * t);
  const g = Math.round(40 + 180 * t);
  const b = Math.round(70 + 185 * t);
  return `rgb(${r},${g},${b})`;
};
