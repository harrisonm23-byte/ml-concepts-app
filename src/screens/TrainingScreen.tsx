import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { Bar, Btn, Card, Chip, Formula, LabeledSlider, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono } from '../theme';
import { clamp, fmt, mulberry32 } from '../math';

// Ten noisy points around y = 0.7x + 2.
const DATA = (() => {
  const rnd = mulberry32(42);
  return Array.from({ length: 10 }, (_, i) => {
    const x = i + 0.5;
    return { x, y: 0.7 * x + 2 + (rnd() * 2 - 1) * 1.4 };
  });
})();
const PHASES = ['Predict', 'Measure', 'Update'] as const;

export default function TrainingScreen() {
  const [a, setA] = useState(-0.4);
  const [b, setB] = useState(6.5);
  const [lr, setLr] = useState(0.02);
  const [phase, setPhase] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [auto, setAuto] = useState(false);
  const [q, setQ] = useState(0.5);

  const preds = DATA.map((d) => a * d.x + b);
  const residuals = DATA.map((d, i) => preds[i] - d.y);
  const loss = residuals.reduce((s, r) => s + r * r, 0) / DATA.length;
  const ga = (2 / DATA.length) * residuals.reduce((s, r, i) => s + r * DATA[i].x, 0);
  const gb = (2 / DATA.length) * residuals.reduce((s, r) => s + r, 0);

  const next = () => {
    if (phase === 2) {
      setA((v) => v - lr * ga);
      setB((v) => v - lr * gb);
      setHistory((h) => [...h, loss]);
      setPhase(0);
    } else setPhase(phase + 1);
  };
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => nextRef.current(), 250);
    return () => clearInterval(id);
  }, [auto]);
  useEffect(() => {
    if (history.length > 150) setAuto(false);
  }, [history.length]);

  const reset = () => {
    setAuto(false);
    setA(-0.4);
    setB(6.5);
    setPhase(0);
    setHistory([]);
  };

  return (
    <Screen intro="Every network that has ever been trained learns by the same three steps: make a prediction, measure how wrong it was, adjust the weights so next time it is a little less wrong. Here the model is a line with two weights, so you can watch every number.">
      <Row style={{ gap: 6 }}>
        {PHASES.map((p, i) => (
          <View key={p} style={[st.phase, i === phase && st.phaseActive]}>
            <Text style={[st.phaseText, i === phase && { color: C.white }]}>{i + 1}. {p}</Text>
          </View>
        ))}
      </Row>

      <Card>
        <Plot a={a} b={b} phase={phase} preds={preds} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Btn label={phase === 0 ? 'Predict ŷ = ax + b' : phase === 1 ? 'Measure the loss' : 'Update the weights'} onPress={() => { setAuto(false); next(); }} />
          <Btn label={auto ? 'Pause' : 'Run'} kind="ghost" onPress={() => setAuto((v) => !v)} />
          <Btn label="Reset" kind="ghost" onPress={reset} />
        </Row>
        {phase === 0 && <P dim>Predict: run every x through the model with the current weights. ŷ = {fmt(a)}·x + {fmt(b)}. The line is the model's guess.</P>}
        {phase === 1 && <P dim>Measure: the red segments are the errors ŷᵢ − yᵢ. Square them (so over- and under-shooting both count, and big misses count a lot), average: MSE = {fmt(loss, 3)}.</P>}
        {phase === 2 && <P dim>Update: the gradient says how the loss changes if each weight is nudged. Step against it, scaled by the learning rate.</P>}
      </Card>

      <Card title="Measure: mean squared error">
        <Formula>L = (1/n) Σᵢ (ŷᵢ − yᵢ)²  =  {fmt(loss, 3)}</Formula>
        <Row wrap style={{ gap: 4 }}>
          {residuals.map((r, i) => (
            <Text key={i} style={[st.res, { color: Math.abs(r) > 1.5 ? C.neg : C.dim }]}>{r >= 0 ? '+' : ''}{fmt(r, 1)}</Text>
          ))}
        </Row>
        <Small>A cubic would keep the sign, so a negative error would reduce the loss: not a candidate. Mean absolute error is the gentler alternative when outliers dominate. If training is failing, the loss function is rarely the reason; the learning rate is the first thing to check.</Small>
      </Card>

      <Card title="Update: the gradient step">
        <Formula>∂L/∂a = {fmt(ga, 3)}     ∂L/∂b = {fmt(gb, 3)}</Formula>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>a ← a − η ∂L/∂a</Text>
          <Text style={st.v}>{fmt(a, 3)} − {fmt(lr)}·{fmt(ga, 2)} = {fmt(a - lr * ga, 3)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>b ← b − η ∂L/∂b</Text>
          <Text style={st.v}>{fmt(b, 3)} − {fmt(lr)}·{fmt(gb, 2)} = {fmt(b - lr * gb, 3)}</Text>
        </Row>
        <LabeledSlider label="learning rate η" value={lr} min={0.001} max={0.06} step={0.001} onChange={setLr} format={(v) => v.toFixed(3)} color={C.warn} />
        <Small>Push η past about 0.04 and watch the loss climb instead of fall: overshooting. Drop it to 0.002 and it creeps. The gradient here is computed by hand from the chain rule; in a deep network backpropagation does the same thing layer by layer, storing each intermediate once.</Small>
      </Card>

      <Card title="Loss over steps">
        <LossChart losses={[...history, loss]} />
        <Small>{history.length} updates so far. Batch size here is the whole dataset (batch gradient descent, the clean path). With mini-batches the path is noisier and each step far cheaper: fifty one-second steps that point roughly right beat three ten-minute steps that point exactly right.</Small>
      </Card>

      <Card title="The same loop in PyTorch">
        <CodeLine text="pred = model(X)" hot={phase === 0} note="predict" />
        <CodeLine text="loss = loss_fn(pred, y)" hot={phase === 1} note="measure" />
        <CodeLine text="loss.backward()" hot={phase === 2} note="gradient (backprop)" />
        <CodeLine text="optimizer.step()" hot={phase === 2} note="θ ← θ − η∇L" />
        <CodeLine text="optimizer.zero_grad()" hot={phase === 2} note="clear for next step" />
        <Small>Four things go in (data, model, loss function, optimizer), and the body is the three verbs. The highlighted lines follow the phase above.</Small>
      </Card>

      <Card title="For classification: cross-entropy">
        <Formula>L = −Σᵢ pᵢ log p̂ᵢ   →   one-hot target:  L = −log p̂(correct)</Formula>
        <LabeledSlider label="p̂ assigned to the correct class" value={q} min={0.01} max={1} step={0.01} onChange={setQ} color={C.accent} />
        <CECurve q={q} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>loss = −ln({fmt(q)})</Text>
          <Text style={[st.v, { color: C.accent }]}>{fmt(-Math.log(q), 3)}</Text>
        </Row>
        <Small>Predict 10% sun on a rainy day (90% on rain) and the loss is small, about 0.1. Predict 95% sun (5% on rain) and it is about 3. This is the loss language models train on: the true target is the token that actually appeared, treated as 100% correct, and each step lowers −log p̂ of that token.</Small>
      </Card>
    </Screen>
  );
}

function Plot({ a, b, phase, preds }: { a: number; b: number; phase: number; preds: number[] }) {
  const W = 340, H = 220, pad = 26;
  const X = (x: number) => pad + (x / 10.5) * (W - 2 * pad);
  const Y = (y: number) => H - pad - (clamp(y, 0, 12) / 12) * (H - 2 * pad);
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      <Line x1={pad} y1={Y(0)} x2={W - pad} y2={Y(0)} stroke={C.border} />
      <Line x1={pad} y1={Y(0)} x2={pad} y2={pad} stroke={C.border} />
      {phase >= 1 && DATA.map((d, i) => (
        <Line key={`r${i}`} x1={X(d.x)} y1={Y(d.y)} x2={X(d.x)} y2={Y(preds[i])} stroke={C.neg} strokeWidth={2} />
      ))}
      <Line x1={X(0)} y1={Y(b)} x2={X(10.5)} y2={Y(a * 10.5 + b)} stroke={phase === 2 ? C.warn : C.accent} strokeWidth={2.5} />
      {DATA.map((d, i) => (
        <Circle key={i} cx={X(d.x)} cy={Y(d.y)} r={5} fill={C.text} />
      ))}
      {DATA.map((d, i) => (
        <Circle key={`p${i}`} cx={X(d.x)} cy={Y(preds[i])} r={3} fill={C.accent} />
      ))}
      <SvgText x={W - pad} y={H - 6} fill={C.dim} fontSize={9} textAnchor="end" fontFamily={mono}>x →</SvgText>
      <SvgText x={pad + 4} y={pad - 8} fill={C.dim} fontSize={9} fontFamily={mono}>y ↑   ● data   ● ŷ</SvgText>
    </Svg>
  );
}

function LossChart({ losses }: { losses: number[] }) {
  const W = 320, H = 100, pad = 20;
  const n = Math.max(2, losses.length);
  const maxL = Math.max(0.5, ...losses);
  const X = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad);
  const Y = (l: number) => H - pad + 6 - (clamp(l, 0, maxL) / maxL) * (H - 2 * pad);
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      <Line x1={pad} y1={Y(0)} x2={W - pad} y2={Y(0)} stroke={C.border} />
      <Polyline points={losses.map((l, i) => `${X(i)},${Y(l)}`).join(' ')} stroke={C.warn} strokeWidth={2} fill="none" />
      <SvgText x={pad} y={12} fill={C.dim} fontSize={9} fontFamily={mono}>MSE {fmt(losses[losses.length - 1], 3)}</SvgText>
    </Svg>
  );
}

function CECurve({ q }: { q: number }) {
  const W = 300, H = 110, pad = 22;
  const qs = Array.from({ length: 80 }, (_, i) => 0.01 + (i * 0.99) / 79);
  const X = (x: number) => pad + x * (W - 2 * pad);
  const Y = (l: number) => H - pad - (clamp(l, 0, 4.7) / 4.7) * (H - 2 * pad);
  const d = qs.map((x, i) => `${i ? 'L' : 'M'} ${X(x)} ${Y(-Math.log(x))}`).join(' ');
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      <Line x1={pad} y1={Y(0)} x2={W - pad} y2={Y(0)} stroke={C.border} />
      <Path d={d} stroke={C.accent} strokeWidth={2} fill="none" />
      <Circle cx={X(q)} cy={Y(-Math.log(q))} r={5} fill={C.warn} />
      <SvgText x={W - pad} y={H - 6} fill={C.dim} fontSize={9} textAnchor="end" fontFamily={mono}>p̂(correct) →</SvgText>
      <SvgText x={pad} y={12} fill={C.dim} fontSize={9} fontFamily={mono}>−log p̂ ↑</SvgText>
    </Svg>
  );
}

function CodeLine({ text, hot, note }: { text: string; hot: boolean; note: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', backgroundColor: hot ? C.accent + '33' : 'transparent', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={[st.code, hot && { color: C.white }]}>{text}</Text>
      <Text style={st.note}># {note}</Text>
    </Row>
  );
}

const st = StyleSheet.create({
  phase: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  phaseActive: { backgroundColor: C.accent, borderColor: C.accent },
  phaseText: { color: C.dim, fontSize: 13, fontWeight: '600' },
  res: { fontFamily: mono, fontSize: 12 },
  k: { color: C.text, fontFamily: mono, fontSize: 12 },
  v: { color: C.text, fontFamily: mono, fontSize: 12 },
  code: { color: C.text, fontFamily: mono, fontSize: 12 },
  note: { color: C.faint, fontFamily: mono, fontSize: 10 },
});
