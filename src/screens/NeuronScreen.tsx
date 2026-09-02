import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Card, Chip, Formula, LabeledSlider, Legend, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono } from '../theme';
import { fmt, heatColor, relu, sigmoid, signedColor } from '../math';

type Act = 'relu' | 'sigmoid' | 'none';
const ACT: Record<Act, { f: (x: number) => number; label: string; formula: string }> = {
  relu: { f: relu, label: 'ReLU', formula: 'ReLU(z) = max(0, z)' },
  sigmoid: { f: sigmoid, label: 'Sigmoid', formula: 'σ(z) = 1 / (1 + e^(−z))' },
  none: { f: (x) => x, label: 'None (linear)', formula: 'a = z' },
};

export default function NeuronScreen() {
  const [a, setA] = useState([0.9, 0.2, 0.7, 0.0]);
  const [w, setW] = useState([1.2, -0.8, 0.5, 0.0]);
  const [b, setB] = useState(-0.4);
  const [act, setAct] = useState<Act>('relu');
  const terms = a.map((ai, j) => w[j] * ai);
  const z = terms.reduce((s, t) => s + t, 0) + b;
  const out = ACT[act].f(z);
  const setAi = (j: number, v: number) => setA((arr) => arr.map((x, i) => (i === j ? v : x)));
  const setWi = (j: number, v: number) => setW((arr) => arr.map((x, i) => (i === j ? v : x)));

  return (
    <Screen intro="The **activation** of a neuron is the weighted sum, over every neuron in the previous layer, of that neuron's activation times the connecting **weight**; plus a **bias**; wrapped in the **activation function**. That is the whole thing. Turn the knobs.">
      <Card>
        <Diagram a={a} w={w} out={out} act={act} />
        <Legend items={[{ color: C.pos, label: 'positive weight' }, { color: C.neg, label: 'negative weight' }, { color: heatColor(0.9), label: 'bright = high activation' }]} />
        <Small>Edge thickness is |w|: how much this neuron cares about that input. Fill brightness is the activation.</Small>
      </Card>

      <Card title="The pre-activation z">
        <Formula>zᵢ = Σⱼ wᵢⱼ aⱼ + bᵢ        aᵢ = σ(zᵢ)</Formula>
        {a.map((ai, j) => (
          <Row key={j} style={{ justifyContent: 'space-between' }}>
            <Text style={st.term}>w{sub(j + 1)} × a{sub(j + 1)}</Text>
            <Text style={st.term}>{fmt(w[j])} × {fmt(ai)}</Text>
            <Text style={[st.term, { color: signedColor(terms[j] / 2 + Math.sign(terms[j]) * 0.5) }]}>= {fmt(terms[j])}</Text>
          </Row>
        ))}
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.term}>+ bias b</Text>
          <Text style={st.term} />
          <Text style={st.term}>= {fmt(b)}</Text>
        </Row>
        <View style={{ height: 1, backgroundColor: C.border }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[st.term, { color: C.warn }]}>pre-activation z</Text>
          <Text style={st.term} />
          <Text style={[st.term, { color: C.warn }]}>= {fmt(z)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[st.term, { color: C.accent }]}>activation a = {ACT[act].label}(z)</Text>
          <Text style={[st.term, { color: C.accent }]}>= {fmt(out)}</Text>
        </Row>
      </Card>

      <Card title="Inputs">
        {a.map((ai, j) => (
          <LabeledSlider key={j} label={`a${sub(j + 1)}`} value={ai} min={0} max={1} onChange={(v) => setAi(j, v)} color={heatColor(0.7)} />
        ))}
      </Card>

      <Card title="Weights">
        {w.map((wi, j) => (
          <LabeledSlider key={j} label={`w${sub(j + 1)}`} value={wi} min={-2} max={2} onChange={(v) => setWi(j, v)} color={wi >= 0 ? C.pos : C.neg} />
        ))}
        <Small>A weight lives on an edge, one for every pair of neurons in adjacent layers. Its magnitude is the strength of the connection. Set a weight to 0 and that input stops mattering, whatever its activation: 0 × anything is 0.</Small>
      </Card>

      <Card title="Bias">
        <LabeledSlider label="b" value={b} min={-2} max={2} onChange={setB} color={C.warn} />
        <Small>Two ways to see it. It is the +b in y = mx + b: an additive offset that gives the function flexibility. Or biologically: a neuron fires only when its input crosses a threshold, and w·a + b {'>'} 0 is w·a {'>'} −b, so the bias sets how hard the neuron is to turn on. Push b negative and watch how much input it takes to fire.</Small>
      </Card>

      <Card title="Activation function">
        <Row wrap>
          {(Object.keys(ACT) as Act[]).map((k) => (
            <Chip key={k} label={ACT[k].label} active={k === act} onPress={() => setAct(k)} />
          ))}
        </Row>
        <Formula>{ACT[act].formula}</Formula>
        <ActPlot act={act} z={z} />
        <Small>Without a **nonlinearity** the whole network collapses: a weighted sum of weighted sums is just another weighted sum, linear regression with extra steps. **ReLU** is an if-statement (negative becomes zero, positive passes through) and it is the modern default. **Sigmoid** squashes to (0,1) and is almost never used in hidden layers now, partly because of vanishing gradients.</Small>
      </Card>
    </Screen>
  );
}

function sub(i: number) {
  return '₀₁₂₃₄₅₆₇₈₉'[i % 10];
}

function Diagram({ a, w, out, act }: { a: number[]; w: number[]; out: number; act: Act }) {
  const W = 320, H = 200;
  const xIn = 50, xOut = 250;
  const ys = a.map((_, j) => 30 + j * 46);
  const yOut = H / 2;
  const fill = act === 'sigmoid' ? out : Math.min(1, out / 2);
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      {a.map((ai, j) => (
        <Line key={j} x1={xIn} y1={ys[j]} x2={xOut} y2={yOut} stroke={signedColor(w[j], 2)} strokeWidth={0.5 + Math.abs(w[j]) * 3.5} />
      ))}
      {a.map((ai, j) => (
        <React.Fragment key={j}>
          <Circle cx={xIn} cy={ys[j]} r={15} fill={heatColor(ai)} stroke={C.border} />
          <SvgText x={xIn} y={ys[j] + 4} fill={ai > 0.5 ? C.bg : C.text} fontSize={10} textAnchor="middle" fontFamily={mono}>{ai.toFixed(2)}</SvgText>
          <SvgText x={xIn - 24} y={ys[j] + 4} fill={C.dim} fontSize={10} textAnchor="end" fontFamily={mono}>a{sub(j + 1)}</SvgText>
          <SvgText x={(xIn + xOut) / 2 - 20} y={(ys[j] + yOut) / 2 - 4 + (j - 1.5) * 6} fill={C.dim} fontSize={9} fontFamily={mono}>w{sub(j + 1)}={w[j].toFixed(1)}</SvgText>
        </React.Fragment>
      ))}
      <Circle cx={xOut} cy={yOut} r={26} fill={heatColor(fill)} stroke={C.accent} strokeWidth={2} />
      <SvgText x={xOut} y={yOut + 4} fill={fill > 0.5 ? C.bg : C.text} fontSize={12} textAnchor="middle" fontFamily={mono}>{out.toFixed(2)}</SvgText>
      <SvgText x={xOut} y={yOut + 44} fill={C.dim} fontSize={10} textAnchor="middle" fontFamily={mono}>{ACT[act].label}(Σ w·a + b)</SvgText>
    </Svg>
  );
}

function ActPlot({ act, z }: { act: Act; z: number }) {
  const W = 300, H = 120, pad = 20;
  const xs = Array.from({ length: 61 }, (_, i) => -3 + i * 0.1);
  const f = ACT[act].f;
  const ymin = act === 'sigmoid' ? -0.2 : -1, ymax = act === 'sigmoid' ? 1.2 : 3;
  const X = (x: number) => pad + ((x + 3) / 6) * (W - 2 * pad);
  const Y = (y: number) => H - pad - ((Math.min(ymax, Math.max(ymin, y)) - ymin) / (ymax - ymin)) * (H - 2 * pad);
  const d = xs.map((x, i) => `${i ? 'L' : 'M'} ${X(x)} ${Y(f(x))}`).join(' ');
  const zc = Math.min(3, Math.max(-3, z));
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      <Line x1={pad} y1={Y(0)} x2={W - pad} y2={Y(0)} stroke={C.border} />
      <Line x1={X(0)} y1={pad} x2={X(0)} y2={H - pad} stroke={C.border} />
      <Path d={d} stroke={C.accent} strokeWidth={2} fill="none" />
      <Line x1={X(zc)} y1={Y(0)} x2={X(zc)} y2={Y(f(zc))} stroke={C.warn} strokeDasharray="3,3" />
      <Circle cx={X(zc)} cy={Y(f(zc))} r={5} fill={C.warn} />
      <SvgText x={X(zc)} y={H - 4} fill={C.warn} fontSize={9} textAnchor="middle" fontFamily={mono}>z={fmt(z)}</SvgText>
      <SvgText x={W - pad} y={12} fill={C.dim} fontSize={9} textAnchor="end" fontFamily={mono}>σ(z)</SvgText>
    </Svg>
  );
}

const st = StyleSheet.create({
  term: { color: C.text, fontFamily: mono, fontSize: 13, minWidth: 80 },
});
