import { C } from './theme';

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

// Colour for a signed value in [-1, 1]: palette positive/negative hue, pale near zero.
export const signedColor = (v: number, max = 1) => {
  const t = clamp(Math.abs(v) / max, 0, 1);
  const a = 0.12 + 0.88 * t;
  return `rgba(${v >= 0 ? C.posRGB : C.negRGB},${a.toFixed(2)})`;
};

// Text colour that stays legible on top of signedColor / heatColor fills.
export const onFill = (v: number, max = 1) => (Math.abs(v) / max > 0.55 ? C.onHi : C.onLo);

// Colour for an unsigned activation in [0, 1]: palette low tone to high tone.
export const heatColor = (v: number) => {
  const t = clamp(v, 0, 1);
  const c = C.heatLo.map((lo, i) => Math.round(lo + (C.heatHi[i] - lo) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const norm = (a: number[]) => Math.sqrt(dot(a, a));
export const cosine = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b) || 1);
export const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);
export const addv = (a: number[], b: number[]) => a.map((v, i) => v + b[i]);

// Principal component analysis by power iteration with deflation.
// Returns the top-k unit eigenvectors of the covariance of `rows` (centred), plus the mean.
export function pca(rows: number[][], k = 3): { comps: number[][]; mean: number[]; variance: number[] } {
  const d = rows[0].length, n = rows.length;
  const mean = Array.from({ length: d }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / n);
  const X = rows.map((r) => sub(r, mean));
  let cov = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0) / n));
  const comps: number[][] = [], variance: number[] = [];
  for (let c = 0; c < k; c++) {
    let v = Array.from({ length: d }, (_, i) => Math.cos(i + c * 1.7) + 0.3);
    let lambda = 0;
    for (let it = 0; it < 200; it++) {
      const w = cov.map((row) => dot(row, v));
      lambda = norm(w);
      if (lambda < 1e-12) break;
      v = w.map((x) => x / lambda);
    }
    comps.push(v);
    variance.push(lambda);
    cov = cov.map((row, i) => row.map((x, j) => x - lambda * v[i] * v[j]));
  }
  return { comps, mean, variance };
}
export const project = (v: number[], mean: number[], comps: number[][]) => comps.map((c) => dot(sub(v, mean), c));
