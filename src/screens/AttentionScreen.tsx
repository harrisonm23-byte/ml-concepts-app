import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Bar, Card, Chip, Formula, LabeledSlider, Legend, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono, themed } from '../theme';
import { cellColor, dot, fmt, onFill, softmax } from '../math';

// Hand-designed 4-dim query/key/value vectors. Feature axes:
// [thing-ness, container/object-ness, function-word-ness, verb-ness]
type Tok = { t: string; q: number[]; k: number[] };
const TOKENS: Tok[] = [
  { t: 'The',      q: [0, 0, 0.5, 0.2],       k: [0, 0, 1, 0] },
  { t: 'trophy',   q: [0.3, 0, 0.8, 0],       k: [1, 0.55, 0, 0] },
  { t: "didn't",   q: [0.5, 0, 0, 1],         k: [0, 0, 0.3, 0.8] },
  { t: 'fit',      q: [1, 0.3, 0, 0.5],       k: [0, 0.1, 0, 1] },
  { t: 'in',       q: [0.4, 0.4, 0.4, 0],     k: [0, 0, 1, 0] },
  { t: 'the',      q: [0.4, 0, 0.6, 0.2],     k: [0, 0, 1, 0] },
  { t: 'suitcase', q: [0.4, 0.3, 0.7, 0],     k: [1, 0.95, 0, 0] },
  { t: 'because',  q: [0, 0, 0.2, 1],         k: [0, 0, 1, 0] },
  { t: 'it',       q: [1.5, 0.5, -0.6, -0.3], k: [0.5, 0.3, 0.4, 0] },
  { t: 'was',      q: [1, 0.2, 0, 0.4],       k: [0, 0, 0.2, 0.9] },
  { t: 'too',      q: [0.2, 0.2, 0.5, 0],     k: [0, 0, 1, 0] },
  { t: 'big',      q: [0.9, 1.1, -0.4, 0],    k: [0.2, 0.5, 0, 0] },
];
const D = 4;
const AXES = ['thing', 'object', 'function', 'verb'];

export default function AttentionScreen() {
  const [qi, setQi] = useState(8);
  const [scale, setScale] = useState(1 / Math.sqrt(D));
  const [causal, setCausal] = useState(true);
  const q = TOKENS[qi].q;

  const { scores, weights, visible } = useMemo(() => {
    const visible = TOKENS.map((_, i) => !causal || i <= qi);
    const scores = TOKENS.map((tk) => dot(q, tk.k) * scale);
    const masked = scores.map((s, i) => (visible[i] ? s : -Infinity));
    const weights = softmax(masked.map((s) => (isFinite(s) ? s : -1e9)));
    return { scores, weights: weights.map((w, i) => (visible[i] ? w : 0)), visible };
  }, [qi, scale, causal]);

  const out = Array.from({ length: D }, (_, k) => TOKENS.reduce((s, tk, i) => s + weights[i] * tk.k[k], 0));

  const W = 340, H = 150;
  const xOf = (i: number) => 14 + (i * (W - 28)) / (TOKENS.length - 1);

  return (
    <Screen intro="**Attention** is what lets the model look back and decide which earlier tokens matter for the current guess. Pick a **query** token; every earlier token is scored by how well its **key** matches the query, **softmax** turns the scores into weights, and the weights mix the values.">
      <Card title="Attention weights">
        <Row wrap style={{ gap: 6 }}>
          {TOKENS.map((tk, i) => (
            <Chip key={i} label={tk.t} active={i === qi} onPress={() => setQi(i)} />
          ))}
        </Row>
        <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
          {TOKENS.map((tk, i) => {
            if (i === qi || !visible[i]) return null;
            const x1 = xOf(qi), x2 = xOf(i);
            const mid = (x1 + x2) / 2;
            const lift = Math.min(110, 30 + Math.abs(x1 - x2) * 0.45);
            return (
              <Path
                key={i}
                d={`M ${x1} ${H - 30} Q ${mid} ${H - 30 - lift} ${x2} ${H - 30}`}
                stroke={C.accent2}
                strokeWidth={1 + weights[i] * 9}
                strokeOpacity={0.25 + weights[i] * 0.75}
                fill="none"
              />
            );
          })}
          {TOKENS.map((tk, i) => (
            <SvgText
              key={i}
              x={xOf(i)}
              y={H - 10}
              fill={i === qi ? C.neg : visible[i] ? C.text : C.faint}
              fontSize={9}
              fontFamily={mono}
              textAnchor="middle"
              onPress={() => setQi(i)}
            >
              {tk.t}
            </SvgText>
          ))}
        </Svg>
        <Small>Arc thickness = attention weight from <Text style={{ color: C.neg }}>{TOKENS[qi].t}</Text>. In the lecture's example, resolving what "it" refers to is attention at work: its query matches the keys of trophy and suitcase.</Small>
      </Card>

      <Card title="Scaled dot-product attention">
        <Formula>scoreᵢ = q · kᵢ / √dₖ      wᵢ = softmax(score)ᵢ</Formula>
        {TOKENS.map((tk, i) => (
          <Row key={i} style={{ gap: 6 }}>
            <Text style={[st.tok, !visible[i] && { color: C.faint }, i === qi && { color: C.neg }]}>{tk.t}</Text>
            <Text style={st.score}>{visible[i] ? fmt(scores[i]) : 'masked'}</Text>
            <View style={{ flex: 1 }}>
              <Bar value={weights[i]} color={i === qi ? C.neg : C.accent2} height={10} />
            </View>
            <Text style={st.pct}>{visible[i] ? `${(weights[i] * 100).toFixed(0)}%` : ''}</Text>
          </Row>
        ))}
        <LabeledSlider label="Scale (1/√dₖ = 0.50 here)" value={scale} min={0.1} max={3} step={0.05} onChange={setScale} color={C.accent2} />
        <Row>
          <Chip label="Causal mask (only look back)" active={causal} onPress={() => setCausal(!causal)} />
        </Row>
        <Small>Raise the scale and the softmax sharpens onto the single best match; lower it and attention spreads out. Dividing by √dₖ keeps scores in a range where softmax is neither flat nor saturated. A decoder-only language model masks future positions: when predicting the next token, it can only attend backwards.</Small>
      </Card>

      <Card title="Values and the attention output">
        <P dim>Each token carries a query (what am I looking for?), a key (what do I contain?), and a **value** (what do I pass on). Axes here are hand-made features; in a real model they are learned and there are 64–128 of them per head.</P>
        <VecRow label={`q (${TOKENS[qi].t})`} v={q} color={C.neg} />
        {TOKENS.filter((_, i) => visible[i] && weights[i] > 0.04).map((tk, j) => {
          const i = TOKENS.indexOf(tk);
          return <VecRow key={i} label={`k (${tk.t})`} v={tk.k} right={`w=${fmt(weights[i])}`} />;
        })}
        <View style={{ height: 1, backgroundColor: C.border }} />
        <VecRow label="Σ wᵢ vᵢ  (output)" v={out} color={C.pos} />
        <Row style={{ justifyContent: 'space-around' }}>
          {AXES.map((a) => <Small key={a}>{a}</Small>)}
        </Row>
        <Small>The output vector for "{TOKENS[qi].t}" is now a weighted blend of what it attended to. That blended vector is what the feed-forward layer processes next, and a stack of these blocks is the whole transformer.</Small>
      </Card>

      <Card title="The transformer block">
        <BlockDiagram />
        <Small>Each block: attention (tokens exchange information) then a feed-forward layer (each position processed on its own). Stack dozens and you have a modern language model. **Multi-head** attention simply runs several of these q/k/v matchings in parallel with different learned axes.</Small>
      </Card>
    </Screen>
  );
}

function VecRow({ label, v, color = C.text, right }: { label: string; v: number[]; color?: string; right?: string }) {
  return (
    <Row style={{ gap: 6 }}>
      <Text style={[st.tok, { color, width: 110 }]} numberOfLines={1}>{label}</Text>
      {v.map((x, k) => (
        <View key={k} style={[st.cell, { backgroundColor: cellColor(x, 1.2) }]}>
          <Text style={[st.cellText, { color: onFill(x, 1.2) }]}>{x.toFixed(2)}</Text>
        </View>
      ))}
      {right ? <Text style={st.pct}>{right}</Text> : null}
    </Row>
  );
}

function BlockDiagram() {
  const W = 300, H = 170;
  const box = (y: number, label: string, color: string) => (
    <>
      <Rect x={70} y={y} width={160} height={30} rx={8} fill={color + '33'} stroke={color} />
      <SvgText x={150} y={y + 20} fill={C.text} fontSize={12} textAnchor="middle" fontFamily={mono}>{label}</SvgText>
    </>
  );
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      <Rect x={50} y={20} width={200} height={110} rx={12} fill="none" stroke={C.border} strokeDasharray="4,3" />
      <SvgText x={258} y={40} fill={C.dim} fontSize={10} fontFamily={mono}>× N</SvgText>
      {box(30, 'attention', C.accent2)}
      <Line x1={150} y1={60} x2={150} y2={80} stroke={C.dim} />
      {box(80, 'feed-forward', C.accent)}
      <Line x1={150} y1={110} x2={150} y2={135} stroke={C.dim} />
      <SvgText x={150} y={155} fill={C.warn} fontSize={12} textAnchor="middle" fontFamily={mono}>logits over vocabulary</SvgText>
      <SvgText x={150} y={14} fill={C.dim} fontSize={11} textAnchor="middle" fontFamily={mono}>tokens + positions in</SvgText>
    </Svg>
  );
}

const st = themed(() => StyleSheet.create({
  tok: { color: C.text, fontFamily: mono, fontSize: 12, width: 66 },
  score: { color: C.dim, fontFamily: mono, fontSize: 11, width: 48, textAlign: 'right' },
  pct: { color: C.dim, fontFamily: mono, fontSize: 11, width: 56, textAlign: 'right' },
  cell: { width: 44, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  cellText: { color: C.white, fontSize: 9, fontFamily: mono },
}));
