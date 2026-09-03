import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Bar, Btn, Card, Chip, Formula, Legend, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono, themed } from '../theme';
import { fmt, heatColor, mulberry32, relu, signedColor, softmax } from '../math';

const SIZES = [4, 5, 3];
const CLASSES = ['cat', 'dog', 'bird'];

function makeWeights(seed: number) {
  const rnd = mulberry32(seed);
  const W1 = Array.from({ length: SIZES[1] }, () => Array.from({ length: SIZES[0] }, () => (rnd() * 2 - 1) * 1.5));
  const b1 = Array.from({ length: SIZES[1] }, () => (rnd() * 2 - 1) * 0.5);
  const W2 = Array.from({ length: SIZES[2] }, () => Array.from({ length: SIZES[1] }, () => (rnd() * 2 - 1) * 1.5));
  const b2 = Array.from({ length: SIZES[2] }, () => (rnd() * 2 - 1) * 0.5);
  return { W1, b1, W2, b2 };
}

export default function ForwardPassScreen() {
  const [seed, setSeed] = useState(7);
  const { W1, b1, W2, b2 } = useMemo(() => makeWeights(seed), [seed]);
  const [a0, setA0] = useState([1, 0, 0.5, 1]);
  const [reveal, setReveal] = useState(0); // 0: inputs only, 1: hidden, 2: output
  const [sel, setSel] = useState<{ layer: 1 | 2; i: number } | null>({ layer: 1, i: 0 });

  const z1 = W1.map((row, i) => row.reduce((s, w, j) => s + w * a0[j], 0) + b1[i]);
  const a1 = z1.map(relu);
  const z2 = W2.map((row, i) => row.reduce((s, w, j) => s + w * a1[j], 0) + b2[i]);
  const probs = softmax(z2);

  const cycleInput = (j: number) => {
    setA0((a) => a.map((v, k) => (k === j ? (v === 0 ? 0.5 : v === 0.5 ? 1 : 0) : v)));
  };

  const W = 340, H = 300;
  const xs = [45, 170, 295];
  const yOf = (layer: number, i: number) => {
    const n = SIZES[layer];
    const gap = Math.min(52, (H - 40) / n);
    return H / 2 - ((n - 1) * gap) / 2 + i * gap;
  };
  const shown = (layer: number) => layer <= reveal;

  const selRow = sel ? (sel.layer === 1 ? W1[sel.i] : W2[sel.i]) : null;
  const selIn = sel ? (sel.layer === 1 ? a0 : a1) : null;
  const selB = sel ? (sel.layer === 1 ? b1[sel.i] : b2[sel.i]) : 0;
  const selZ = sel ? (sel.layer === 1 ? z1[sel.i] : z2[sel.i]) : 0;
  const selVisible = sel ? shown(sel.layer) : false;

  return (
    <Screen intro="A vanilla network (a **multilayer perceptron**): every neuron connects to every neuron in the previous layer. Which neurons fire in one layer determines which fire in the next, as governed by the weights and biases. Tap input nodes to set them, then propagate.">
      <Card>
        <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
          {/* edges layer 0 -> 1 */}
          {W1.map((row, i) =>
            row.map((w, j) => {
              const hl = sel && sel.layer === 1 && sel.i === i;
              const dim = sel && !hl;
              return <Line key={`e1-${i}-${j}`} x1={xs[0]} y1={yOf(0, j)} x2={xs[1]} y2={yOf(1, i)} stroke={signedColor(w, 1.5)} strokeWidth={0.4 + Math.abs(w) * 2.2} strokeOpacity={dim ? 0.18 : 1} />;
            }),
          )}
          {W2.map((row, i) =>
            row.map((w, j) => {
              const hl = sel && sel.layer === 2 && sel.i === i;
              const dim = sel && !hl;
              return <Line key={`e2-${i}-${j}`} x1={xs[1]} y1={yOf(1, j)} x2={xs[2]} y2={yOf(2, i)} stroke={signedColor(w, 1.5)} strokeWidth={0.4 + Math.abs(w) * 2.2} strokeOpacity={dim ? 0.18 : 1} />;
            }),
          )}
          {/* nodes */}
          {a0.map((v, j) => (
            <React.Fragment key={`n0-${j}`}>
              <Circle cx={xs[0]} cy={yOf(0, j)} r={16} fill={heatColor(v)} stroke={C.border} strokeWidth={1.5} onPress={() => cycleInput(j)} />
              <SvgText x={xs[0]} y={yOf(0, j) + 4} fill={v > 0.5 ? C.bg : C.text} fontSize={10} textAnchor="middle" fontFamily={mono} onPress={() => cycleInput(j)}>{v.toFixed(1)}</SvgText>
            </React.Fragment>
          ))}
          {a1.map((v, i) => (
            <React.Fragment key={`n1-${i}`}>
              <Circle cx={xs[1]} cy={yOf(1, i)} r={16} fill={shown(1) ? heatColor(Math.min(1, v / 2)) : C.card2} stroke={sel?.layer === 1 && sel.i === i ? C.warn : C.border} strokeWidth={sel?.layer === 1 && sel.i === i ? 3 : 1.5} onPress={() => setSel({ layer: 1, i })} />
              <SvgText x={xs[1]} y={yOf(1, i) + 4} fill={shown(1) && v / 2 > 0.5 ? C.bg : C.text} fontSize={10} textAnchor="middle" fontFamily={mono} onPress={() => setSel({ layer: 1, i })}>{shown(1) ? v.toFixed(1) : '?'}</SvgText>
            </React.Fragment>
          ))}
          {probs.map((p, i) => (
            <React.Fragment key={`n2-${i}`}>
              <Circle cx={xs[2]} cy={yOf(2, i)} r={16} fill={shown(2) ? heatColor(p) : C.card2} stroke={sel?.layer === 2 && sel.i === i ? C.warn : C.border} strokeWidth={sel?.layer === 2 && sel.i === i ? 3 : 1.5} onPress={() => setSel({ layer: 2, i })} />
              <SvgText x={xs[2]} y={yOf(2, i) + 4} fill={shown(2) && p > 0.5 ? C.bg : C.text} fontSize={10} textAnchor="middle" fontFamily={mono} onPress={() => setSel({ layer: 2, i })}>{shown(2) ? p.toFixed(2) : '?'}</SvgText>
              <SvgText x={xs[2] + 22} y={yOf(2, i) + 4} fill={C.dim} fontSize={10} fontFamily={mono}>{CLASSES[i]}</SvgText>
            </React.Fragment>
          ))}
          <SvgText x={xs[0]} y={14} fill={C.dim} fontSize={10} textAnchor="middle" fontFamily={mono}>input a⁽⁰⁾</SvgText>
          <SvgText x={xs[1]} y={14} fill={C.dim} fontSize={10} textAnchor="middle" fontFamily={mono}>hidden a⁽¹⁾ (ReLU)</SvgText>
          <SvgText x={xs[2]} y={14} fill={C.dim} fontSize={10} textAnchor="middle" fontFamily={mono}>output (softmax)</SvgText>
        </Svg>
        <Row style={{ justifyContent: 'space-between' }}>
          <Btn label={reveal === 0 ? 'Compute hidden layer →' : reveal === 1 ? 'Compute output →' : 'Start over'} onPress={() => setReveal((r) => (r + 1) % 3)} />
          <Btn label="Random weights" kind="ghost" onPress={() => setSeed((s) => s + 1)} />
        </Row>
        <Legend items={[{ color: C.pos, label: '+ weight' }, { color: C.neg, label: '− weight' }, { color: heatColor(0.9), label: 'activation' }]} />
        <Small>Tap an input to cycle 0 → 0.5 → 1. Tap a hidden or output neuron to see its own equation and highlight its incoming edges. The weights here are random, as every network's are before training.</Small>
      </Card>

      {sel && selRow && selIn && (
        <Card title={`Neuron ${sel.i + 1} of layer ${sel.layer}`}>
          <Formula>z = Σⱼ wⱼ aⱼ + b   →   a = {sel.layer === 1 ? 'ReLU(z)' : 'softmax(z)'}</Formula>
          {selRow.map((w, j) => (
            <Row key={j} style={{ justifyContent: 'space-between' }}>
              <Text style={st.term}>w{sub(j + 1)} · a{sub(j + 1)}</Text>
              <Text style={[st.term, { color: signedColor(w, 1.5) }]}>{fmt(w)}</Text>
              <Text style={st.term}>× {selVisible || sel.layer === 1 ? fmt(selIn[j]) : '?'}</Text>
              <Text style={[st.term, { textAlign: 'right' }]}>{selVisible || sel.layer === 1 ? `= ${fmt(w * selIn[j])}` : ''}</Text>
            </Row>
          ))}
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={st.term}>+ b</Text>
            <Text style={[st.term, { color: C.warn }]}>{fmt(selB)}</Text>
            <Text style={st.term} />
            <Text style={st.term} />
          </Row>
          <View style={{ height: 1, backgroundColor: C.border }} />
          {selVisible ? (
            <>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={[st.term, { color: C.warn }]}>z</Text>
                <Text style={[st.term, { color: C.warn, textAlign: 'right' }]}>= {fmt(selZ)}</Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={[st.term, { color: C.accent }]}>{sel.layer === 1 ? 'ReLU(z)' : 'softmax(z)'}</Text>
                <Text style={[st.term, { color: C.accent, textAlign: 'right' }]}>= {fmt(sel.layer === 1 ? a1[sel.i] : probs[sel.i])}</Text>
              </Row>
            </>
          ) : (
            <Small>Not computed yet: press the propagate button above.</Small>
          )}
        </Card>
      )}

      <Card title="Matrix form">
        <Formula>a⁽¹⁾ = ReLU( W⁽¹⁾ a⁽⁰⁾ + b⁽¹⁾ )     W⁽¹⁾ is {SIZES[1]}×{SIZES[0]}</Formula>
        <Formula>logits = W⁽²⁾ a⁽¹⁾ + b⁽²⁾           W⁽²⁾ is {SIZES[2]}×{SIZES[1]}</Formula>
        <Small>Same statement as the per-neuron sum, for every neuron in the layer simultaneously. Parameter count here: {SIZES[1] * SIZES[0] + SIZES[1] + SIZES[2] * SIZES[1] + SIZES[2]}. The lecture's digit network (784 → 512 → 512 → 10) has about 670,000. A frontier language model has hundreds of billions, and it is still this operation.</Small>
      </Card>

      <Card title="Output layer">
        {CLASSES.map((c, i) => (
          <Bar key={c} label={c} value={shown(2) ? probs[i] : 0} color={C.accent} right={shown(2) ? `${(probs[i] * 100).toFixed(0)}%` : '?'} />
        ))}
        <Small>The output is the same shape as a language model's: a score for every class, then **softmax**. Next-token prediction is **classification** with a bigger output layer. The picture we hope training produces: early neurons respond to strokes, the next layer combines strokes into loops and lines, the last layer combines parts into a digit.</Small>
      </Card>
    </Screen>
  );
}

function sub(i: number) {
  return '₀₁₂₃₄₅₆₇₈₉'[i % 10];
}

const st = themed(() => StyleSheet.create({
  term: { color: C.text, fontFamily: mono, fontSize: 13, minWidth: 64 },
}));
