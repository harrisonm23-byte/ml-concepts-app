import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { C, S, mono, serif, shadowFor, themed } from '../theme';

// Minimal inline markup: **bold** for defined terms, *italic* for emphasis, as in the handouts.
export function rich(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') {
    const parts = children.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
    if (parts.length === 1 && !/^\*/.test(parts[0])) return children;
    return parts.map((t, i) =>
      t.startsWith('**') ? <Text key={i} style={{ fontWeight: '700' }}>{t.slice(2, -2)}</Text>
      : t.startsWith('*') ? <Text key={i} style={{ fontStyle: 'italic' }}>{t.slice(1, -1)}</Text>
      : t,
    );
  }
  if (Array.isArray(children)) return children.map((c, i) => <React.Fragment key={i}>{rich(c)}</React.Fragment>);
  return children;
}

export function Screen({
  children,
  intro,
}: {
  children: React.ReactNode;
  intro?: string;
}) {
  // Rendered inline inside the accordion, so this is a plain View, not a ScrollView.
  return (
    <View style={{ gap: S.lg, paddingBottom: S.md }}>
      {intro ? <Text style={st.intro}>{rich(intro)}</Text> : null}
      {children}
    </View>
  );
}

export function Card({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[st.card, style]}>
      {title ? <Text style={st.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function P({ children, dim, style }: { children: React.ReactNode; dim?: boolean; style?: TextStyle }) {
  return <Text style={[st.p, dim && { color: C.dim }, style]}>{rich(children)}</Text>;
}

export function Small({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[st.small, style]}>{rich(children)}</Text>;
}

export function Mono({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[st.mono, style]}>{children}</Text>;
}

export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <View style={st.formula}>
      <Text style={st.formulaText}>{children}</Text>
    </View>
  );
}

export function Row({ children, style, wrap }: { children: React.ReactNode; style?: ViewStyle; wrap?: boolean }) {
  return <View style={[st.row, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const bg = kind === 'primary' ? C.forest : kind === 'danger' ? C.neg : C.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        st.btn,
        { backgroundColor: bg, borderColor: kind === 'ghost' ? C.border : bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[st.btnText, kind === 'ghost' && { color: C.forest }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
  sub,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  sub?: string;
}) {
  const c = color ?? C.forest;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[st.chip, { borderColor: active ? c : C.border, backgroundColor: active ? c + '14' : C.card }]}>
      <Text style={[st.chipText, active && { color: c, fontWeight: '600' }]}>{label}</Text>
      {sub ? <Text style={st.chipSub}>{sub}</Text> : null}
    </Pressable>
  );
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format = (v: number) => v.toFixed(2),
  color = C.accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  color?: string;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={st.sliderLabel}>{label}</Text>
        <Text style={[st.sliderValue, { color }]}>{format(value)}</Text>
      </Row>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={C.border}
        thumbTintColor={color}
        style={{ width: '100%', height: 32 }}
      />
    </View>
  );
}

export function Bar({
  value,
  max = 1,
  color = C.accent,
  height = 14,
  label,
  right,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  right?: string;
}) {
  const w = Math.max(0, Math.min(1, value / max));
  return (
    <Row style={{ alignItems: 'center', gap: S.sm }}>
      {label !== undefined ? <Text style={st.barLabel} numberOfLines={1}>{label}</Text> : null}
      <View style={{ flex: 1, height, backgroundColor: C.card2, borderRadius: height / 2, overflow: 'hidden' }}>
        <View style={{ width: `${w * 100}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
      </View>
      {right !== undefined ? <Text style={st.barRight}>{right}</Text> : null}
    </Row>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <Row wrap style={{ gap: S.md }}>
      {items.map((it) => (
        <Row key={it.label} style={{ alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: it.color }} />
          <Small>{it.label}</Small>
        </Row>
      ))}
    </Row>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: C.border, marginVertical: S.sm }} />;
}

const st = themed(() => StyleSheet.create({
  intro: { color: C.text, fontSize: 16, lineHeight: 24, fontFamily: serif },
  card: {
    backgroundColor: C.card,
    borderRadius: 2,
    padding: S.lg,
    gap: S.md,
    borderWidth: 1,
    borderColor: C.border,
    ...shadowFor(),
  },
  cardTitle: { color: C.text, fontSize: 18, fontFamily: serif, fontWeight: '700' },
  p: { color: C.text, fontSize: 16, lineHeight: 24, fontFamily: serif },
  small: { color: C.dim, fontSize: 14, lineHeight: 20, fontFamily: serif },
  mono: { color: C.text, fontFamily: mono, fontSize: 13 },
  formula: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  formulaText: { color: C.text, fontFamily: serif, fontStyle: 'italic', fontSize: 17, lineHeight: 26, textAlign: 'center' },
  row: { flexDirection: 'row', gap: S.sm, alignItems: 'center' },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 2,
    borderWidth: 1,
  },
  btnText: { color: C.white, fontWeight: '600', fontSize: 14, fontFamily: serif },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: { color: C.text, fontSize: 14, fontFamily: mono },
  chipSub: { color: C.dim, fontSize: 10, fontFamily: mono },
  sliderLabel: { color: C.text, fontSize: 15, fontFamily: serif, fontStyle: 'italic' },
  sliderValue: { fontFamily: mono, fontSize: 14 },
  barLabel: { color: C.text, fontFamily: mono, fontSize: 13, width: 88 },
  barRight: { color: C.dim, fontFamily: mono, fontSize: 12, width: 52, textAlign: 'right' },
}));
