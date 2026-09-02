import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Circle, Text as SvgText } from 'react-native-svg';
import { Bar, Btn, Card, Chip, Formula, LabeledSlider, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono } from '../theme';
import { argmax, entropy, fmt, sampleIndex, softmax } from '../math';
import Simplex from '../components/Simplex';

const CANDIDATES = ['Paris', 'the', 'a', 'Lyon', 'located', 'NPRD'];
const DEFAULT_LOGITS = [4.0, 1.6, 1.2, 0.9, 0.3, -1.6];

export default function SoftmaxScreen() {
  const [logits, setLogits] = useState(DEFAULT_LOGITS);
  const [T, setT] = useState(1);
  const [history, setHistory] = useState<number[]>([]);
  const probs = useMemo(() => softmax(logits, T), [logits, T]);
  const H = entropy(probs);
  const best = argmax(probs);
  const lo = Math.min(...logits), hi = Math.max(...logits);

  const setLogit = (i: number, v: number) => setLogits((l) => l.map((x, j) => (j === i ? v : x)));

  return (
    <Screen intro='The transformer ends with one raw score per vocabulary entry. Three operations turn those into the next word: softmax, temperature, and a decoding decision. Prompt: "The capital of France is"'>
      <Card title="Logits: the model's unnormalized opinion">
        {CANDIDATES.map((c, i) => (
          <Bar key={c} label={c} value={logits[i] - lo + 0.5} max={hi - lo + 0.5} color={logits[i] < 0 ? C.neg : C.warn} right={fmt(logits[i])} />
        ))}
        <Small>Logits can be negative and do not sum to one. Drag them below to reshape the model's opinion.</Small>
        <View style={{ gap: 0 }}>
          {CANDIDATES.map((c, i) => (
            <LabeledSlider key={c} label={`z(${c})`} value={logits[i]} min={-4} max={6} step={0.1} onChange={(v) => setLogit(i, v)} color={C.warn} />
          ))}
        </View>
        <Row>
          <Btn label="Reset logits" kind="ghost" onPress={() => setLogits(DEFAULT_LOGITS)} />
        </Row>
      </Card>

      <Card title="Softmax with temperature">
        <Formula>P(xᵢ) = e^(zᵢ/T) / Σⱼ e^(zⱼ/T)</Formula>
        <Small>The result is a probability mass function over the vocabulary: bars are the standard picture for a discrete distribution, because the outcomes are unordered categories and each bar's height is the probability. Heights sum to 1.</Small>
        <LabeledSlider label="Temperature T" value={T} min={0.05} max={3} step={0.05} onChange={setT} color={C.accent} />
        {CANDIDATES.map((c, i) => (
          <Bar key={c} label={c} value={probs[i]} color={i === best ? C.accent : C.accent + '99'} right={`${(probs[i] * 100).toFixed(1)}%`} />
        ))}
        <Row style={{ justifyContent: 'space-between' }}>
          <Small>Σ P = {fmt(probs.reduce((a, b) => a + b, 0), 3)}</Small>
          <Small>entropy H(P) = {fmt(H)} nats  (max ln 6 = {fmt(Math.log(6))})</Small>
        </Row>
        <TempCurve logits={logits} />
        <Small>
          As T → 0 the distribution collapses onto the top token (greedy). As T grows it flattens toward uniform. Low T is predictable and conservative; high T is more varied and more error-prone. Temperature is a literal parameter in an API call, not a metaphor.
        </Small>
      </Card>

      <Card title="The distribution as a point: the probability simplex">
        <P>A distribution over V outcomes is a vector p with pᵢ ≥ 0 and Σpᵢ = 1. The set of all such vectors is the (V−1)-simplex. For three tokens it is a triangle, and every possible distribution is exactly one point of it. Softmax is a map from logit space ℝ³ onto this triangle.</P>
        <Simplex logits={logits.slice(0, 3)} labels={CANDIDATES.slice(0, 3)} T={T} />
        <Small>
          Softmax over the first three logits ({CANDIDATES.slice(0, 3).join(', ')}). The red point is the distribution at the current T. The gold curve is its path as T runs from 0 (a corner: all mass on one token, greedy) to ∞ (the centre: uniform). Shading is entropy, highest at the centre and zero at the corners. Move the temperature slider above and watch the point slide along the curve.
        </Small>
      </Card>

      <Card title="Decoding: greedy or sample">
        <Row>
          <Btn label="Greedy: arg max" onPress={() => setHistory((h) => [...h, best])} />
          <Btn label="Sample: xₜ ~ P" kind="ghost" onPress={() => setHistory((h) => [...h, sampleIndex(probs)])} />
          <Btn label="Clear" kind="ghost" onPress={() => setHistory([])} />
        </Row>
        <Row wrap style={{ gap: 6, minHeight: 34 }}>
          {history.map((i, n) => (
            <Chip key={n} label={CANDIDATES[i]} active color={i === best ? C.accent : CANDIDATES[i] === 'NPRD' ? C.neg : C.pos} />
          ))}
          {history.length === 0 && <Small>draws will appear here</Small>}
        </Row>
        {history.length > 3 && (
          <Small>
            Greedy gives the same token every time: deterministic but dull and repetitive. Sampling gives variety at the cost of occasional bad draws.
            {history.includes(5) ? ' You drew NPRD: a garbled low-probability token. In the full loop the next prediction conditions on it and the model steers back to coherence.' : ` Raise T and sample a few times to see an "NPRD" glitch.`}
          </Small>
        )}
      </Card>

      <Card title="Same shape as a classifier">
        <P dim>Next-token prediction is classification with V ≈ 50,000 classes instead of 10. The digit network in Lecture 3 ends with ten logits and this same softmax. And the training loss for both is cross-entropy against the correct class: −log P(correct token).</P>
        <Formula>loss at this step = −log P(x*) = {fmt(-Math.log(probs[0]))}  (if "Paris" is correct)</Formula>
      </Card>
    </Screen>
  );
}

// Probability of the top token as a function of T, plus the entropy curve.
function TempCurve({ logits }: { logits: number[] }) {
  const W = 320, Hh = 120, pad = 28;
  const Ts = Array.from({ length: 60 }, (_, i) => 0.05 + (i * 2.95) / 59);
  const pts = Ts.map((t) => {
    const p = softmax(logits, t);
    return { t, top: Math.max(...p), h: entropy(p) / Math.log(logits.length) };
  });
  const x = (t: number) => pad + ((t - 0.05) / 2.95) * (W - pad - 8);
  const y = (v: number) => Hh - 18 - v * (Hh - 30);
  const path = (key: 'top' | 'h') => pts.map((p, i) => `${i ? 'L' : 'M'} ${x(p.t)} ${y(p[key])}`).join(' ');
  return (
    <Svg width={W} height={Hh} style={{ alignSelf: 'center' }}>
      <Line x1={pad} y1={y(0)} x2={W - 8} y2={y(0)} stroke={C.border} />
      <Line x1={pad} y1={y(1)} x2={pad} y2={y(0)} stroke={C.border} />
      <Path d={path('top')} stroke={C.accent} strokeWidth={2} fill="none" />
      <Path d={path('h')} stroke={C.accent2} strokeWidth={2} fill="none" strokeDasharray="4,3" />
      <SvgText x={pad - 4} y={y(1) + 4} fill={C.dim} fontSize={9} textAnchor="end" fontFamily={mono}>1</SvgText>
      <SvgText x={pad - 4} y={y(0) + 4} fill={C.dim} fontSize={9} textAnchor="end" fontFamily={mono}>0</SvgText>
      <SvgText x={W / 2} y={Hh - 4} fill={C.dim} fontSize={9} textAnchor="middle" fontFamily={mono}>temperature T →</SvgText>
      <SvgText x={W - 10} y={14} fill={C.accent} fontSize={9} textAnchor="end" fontFamily={mono}>P(top token)</SvgText>
      <SvgText x={W - 10} y={26} fill={C.accent2} fontSize={9} textAnchor="end" fontFamily={mono}>entropy / max</SvgText>
    </Svg>
  );
}

const st = StyleSheet.create({});
