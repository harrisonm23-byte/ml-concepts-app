import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { C, mono } from '../theme';

export type Vec3Item = { name: string; p: [number, number, number]; color?: string };
export type Vec3Arrow = { from: [number, number, number]; to: [number, number, number]; color: string; dashed?: boolean; label?: string };

// Orthographic 3-D view with drag-to-rotate, depth cues (size + fog) and a slow idle spin,
// following the conventions of the TensorFlow Embedding Projector.
export default function VectorSpace3D({
  items,
  arrows = [],
  selected,
  onSelect,
  width = 340,
  height = 300,
  scale = 125,
  axes = ['PC1', 'PC2', 'PC3'],
}: {
  items: Vec3Item[];
  arrows?: Vec3Arrow[];
  selected?: string;
  onSelect?: (name: string) => void;
  width?: number;
  height?: number;
  scale?: number;
  axes?: [string, string, string];
}) {
  const [rot, setRot] = useState({ yaw: 0.6, pitch: 0.35 });
  const [idle, setIdle] = useState(true);
  const rotRef = useRef(rot);
  rotRef.current = rot;

  useEffect(() => {
    if (!idle) return;
    const id = setInterval(() => setRot((r) => ({ ...r, yaw: r.yaw + 0.006 })), 40);
    return () => clearInterval(id);
  }, [idle]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 2,
        onPanResponderGrant: () => setIdle(false),
        onPanResponderMove: (_, g) => {
          const r = rotRef.current;
          setRot({ yaw: r.yaw + g.vx * 0.12, pitch: Math.max(-1.4, Math.min(1.4, r.pitch + g.vy * 0.12)) });
        },
      }),
    [],
  );

  const cx = width / 2, cy = height / 2;
  const proj = (p: [number, number, number]) => {
    const [x, y, z] = p;
    const cy1 = Math.cos(rot.yaw), sy1 = Math.sin(rot.yaw);
    const x1 = x * cy1 + z * sy1, z1 = -x * sy1 + z * cy1;
    const cp = Math.cos(rot.pitch), sp = Math.sin(rot.pitch);
    const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    return { sx: cx + x1 * scale, sy: cy - y2 * scale, depth: z2 };
  };
  const fog = (depth: number) => 0.35 + 0.65 * Math.max(0, Math.min(1, (depth + 1.6) / 3.2));

  const ax: [number, number, number][] = [[1.3, 0, 0], [0, 1.3, 0], [0, 0, 1.3]];
  const o = proj([0, 0, 0]);
  const pts = items.map((it) => ({ it, ...proj(it.p) })).sort((a, b) => a.depth - b.depth);
  // Label the nearest-to-camera points first; skip a label that would collide with one already placed.
  const placed: { x: number; y: number }[] = [];
  const labelled = new Set<string>();
  [...pts].reverse().forEach(({ it, sx, sy }) => {
    const hit = placed.some((q) => Math.abs(q.x - sx) < 46 && Math.abs(q.y - sy) < 11);
    if (!hit || it.name === selected) {
      placed.push({ x: sx, y: sy });
      labelled.add(it.name);
    }
  });

  return (
    <View {...pan.panHandlers} style={{ alignSelf: 'center' }}>
      <Svg width={width} height={height}>
        {ax.map((a, i) => {
          const e = proj(a);
          return (
            <React.Fragment key={i}>
              <Line x1={o.sx} y1={o.sy} x2={e.sx} y2={e.sy} stroke={C.faint} strokeWidth={1} strokeOpacity={0.7} />
              <SvgText x={e.sx} y={e.sy - 4} fill={C.dim} fontSize={9} fontFamily={mono} textAnchor="middle">{axes[i]}</SvgText>
            </React.Fragment>
          );
        })}
        {arrows.map((a, i) => {
          const f = proj(a.from), t = proj(a.to);
          const ang = Math.atan2(t.sy - f.sy, t.sx - f.sx);
          const hx = t.sx - 7 * Math.cos(ang), hy = t.sy - 7 * Math.sin(ang);
          return (
            <React.Fragment key={i}>
              <Line x1={f.sx} y1={f.sy} x2={t.sx} y2={t.sy} stroke={a.color} strokeWidth={2} strokeDasharray={a.dashed ? '5,4' : undefined} />
              <Path d={`M ${t.sx} ${t.sy} L ${hx + 4 * Math.sin(ang)} ${hy - 4 * Math.cos(ang)} L ${hx - 4 * Math.sin(ang)} ${hy + 4 * Math.cos(ang)} Z`} fill={a.color} />
              {a.label ? <SvgText x={(f.sx + t.sx) / 2 + 4} y={(f.sy + t.sy) / 2 - 4} fill={a.color} fontSize={9} fontFamily={mono}>{a.label}</SvgText> : null}
            </React.Fragment>
          );
        })}
        {pts.map(({ it, sx, sy, depth }) => {
          const sel = it.name === selected;
          const r = (sel ? 6 : 4) * (0.75 + 0.25 * fog(depth));
          return (
            <React.Fragment key={it.name}>
              <Line x1={o.sx} y1={o.sy} x2={sx} y2={sy} stroke={it.color ?? C.forest} strokeWidth={sel ? 1.5 : 0.6} strokeOpacity={fog(depth) * (sel ? 0.9 : 0.35)} />
              <Circle cx={sx} cy={sy} r={r} fill={it.color ?? C.forest} fillOpacity={fog(depth)} stroke={sel ? C.warn : 'none'} strokeWidth={2} onPress={() => onSelect?.(it.name)} />
              {labelled.has(it.name) && (
                <SvgText x={sx + r + 3} y={sy + 3} fill={sel ? C.forest : C.text} fillOpacity={fog(depth)} fontSize={10} fontWeight={sel ? 'bold' : 'normal'} fontFamily={mono} onPress={() => onSelect?.(it.name)}>{it.name}</SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
