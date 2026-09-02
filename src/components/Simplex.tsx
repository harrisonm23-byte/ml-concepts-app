import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { C, mono } from '../theme';
import { entropy, softmax } from '../math';

// The probability simplex for three outcomes: every distribution (p1,p2,p3) with
// p ≥ 0 and Σp = 1 is exactly one point of this triangle (barycentric coordinates).
// Shading is the entropy H(p); the curve is the path softmax(z/T) traces as T varies.
export default function Simplex({ logits, labels, T, width = 320 }: { logits: number[]; labels: string[]; T: number; width?: number }) {
  const h = width * 0.9;
  const A = [width / 2, 18], B = [18, h - 18], Cc = [width - 18, h - 18];
  const toXY = (p: number[]) => [p[0] * A[0] + p[1] * B[0] + p[2] * Cc[0], p[0] * A[1] + p[1] * B[1] + p[2] * Cc[1]];

  const grid = useMemo(() => {
    const out: { x: number; y: number; h: number }[] = [];
    const N = 22;
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N - i; j++) {
        const p = [i / N, j / N, (N - i - j) / N];
        const [x, y] = toXY(p);
        out.push({ x, y, h: entropy(p) / Math.log(3) });
      }
    return out;
  }, [width]);

  const path = useMemo(() => {
    const Ts = Array.from({ length: 80 }, (_, i) => 0.03 * Math.pow(400, i / 79));
    return Ts.map((t) => toXY(softmax(logits, t)));
  }, [logits, width]);

  const p = softmax(logits, T);
  const [px, py] = toXY(p);
  const center = toXY([1 / 3, 1 / 3, 1 / 3]);

  return (
    <View style={{ alignSelf: 'center' }}>
      <Svg width={width} height={h}>
        <Polygon points={`${A} ${B} ${Cc}`} fill={C.card2} stroke={C.border} />
        {grid.map((g, i) => (
          <Circle key={i} cx={g.x} cy={g.y} r={3.2} fill={C.forest} fillOpacity={0.06 + 0.5 * g.h} />
        ))}
        <Polyline points={path.map((q) => q.join(',')).join(' ')} stroke={C.warn} strokeWidth={2} fill="none" />
        <Circle cx={center[0]} cy={center[1]} r={3} fill={C.dim} />
        <SvgText x={center[0] + 6} y={center[1] + 3} fill={C.dim} fontSize={8} fontFamily={mono}>T→∞ (uniform)</SvgText>
        <Circle cx={px} cy={py} r={7} fill={C.neg} stroke={C.card} strokeWidth={2} />
        <SvgText x={A[0]} y={A[1] - 6} fill={C.forest} fontSize={10} fontFamily={mono} textAnchor="middle">{labels[0]}  (1,0,0)</SvgText>
        <SvgText x={B[0]} y={B[1] + 12} fill={C.forest} fontSize={10} fontFamily={mono} textAnchor="start">{labels[1]}  (0,1,0)</SvgText>
        <SvgText x={Cc[0]} y={Cc[1] + 12} fill={C.forest} fontSize={10} fontFamily={mono} textAnchor="end">{labels[2]}  (0,0,1)</SvgText>
      </Svg>
    </View>
  );
}
