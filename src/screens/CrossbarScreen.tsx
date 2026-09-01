import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bar, Btn, Card, Chip, Formula, LabeledSlider, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono } from '../theme';
import { fmt, relu } from '../math';

const N = 8;
const parse = (rows: string[]) => rows.map((r) => r.split('').map((c) => (c === '#' ? 1 : 0)));

const PRESETS: Record<string, number[][]> = {
  '7': parse(['........', '.######.', '......#.', '.....#..', '....#...', '...#....', '..#.....', '..#.....']),
  '5': parse(['........', '.######.', '.#......', '.#####..', '......#.', '......#.', '.#....#.', '..####..']),
  '6': parse(['........', '...###..', '..#.....', '.#......', '.#####..', '.#....#.', '.#....#.', '..####..']),
  '1': parse(['........', '...#....', '..##....', '...#....', '...#....', '...#....', '...#....', '..###...']),
};
const EMPTY = () => Array.from({ length: N }, () => Array(N).fill(0));
// The "crossbar of a 7" detector: cares about row 1, columns 1–6; ignores everything else.
const CROSSBAR = () => EMPTY().map((row, r) => row.map((_, c) => (r === 1 && c >= 1 && c <= 6 ? 1 : 0)));

export default function CrossbarScreen() {
  const [pix, setPix] = useState<number[][]>(() => PRESETS['7'].map((r) => [...r]));
  const [w, setW] = useState<number[][]>(CROSSBAR);
  const [b, setB] = useState(-3);
  const [mode, setMode] = useState<'draw' | 'weights'>('draw');
  const [preset, setPreset] = useState<string | null>('7');

  const { sumA, sumB, countA, litB, z, a } = useMemo(() => {
    let sumA = 0, sumB = 0, countA = 0, litB = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (w[r][c] !== 0) {
          countA++;
          sumA += w[r][c] * pix[r][c];
        } else {
          sumB += 0 * pix[r][c];
          litB += pix[r][c];
        }
      }
    const z = sumA + sumB + b;
    return { sumA, sumB, countA, litB, z, a: relu(z) };
  }, [pix, w, b]);

  const tap = (r: number, c: number) => {
    if (mode === 'draw') {
      setPreset(null);
      setPix((p) => p.map((row, i) => row.map((v, j) => (i === r && j === c ? 1 - v : v))));
    } else {
      setW((p) => p.map((row, i) => row.map((v, j) => (i === r && j === c ? (v === 0 ? 1 : v === 1 ? -1 : 0) : v))));
    }
  };

  const cellSize = 34;
  const high = a > 1.5;

  return (
    <Screen intro="Suppose a neuron in a trained digit classifier has learned the horizontal crossbar of a 7. Pass in a 6: low activation. Pass in a 5 whose top stroke sits where the crossbar would be: high, even though the digit is different. The formula explains why.">
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row>
            <Chip label="Draw pixels" active={mode === 'draw'} onPress={() => setMode('draw')} />
            <Chip label="Edit weights" active={mode === 'weights'} color={C.pos} onPress={() => setMode('weights')} />
          </Row>
        </Row>
        <View style={{ alignSelf: 'center', gap: 2 }}>
          {pix.map((row, r) => (
            <Row key={r} style={{ gap: 2 }}>
              {row.map((v, c) => {
                const wt = w[r][c];
                const inA = wt !== 0;
                const bg = mode === 'draw' ? (v ? C.white : C.card2) : wt > 0 ? C.pos : wt < 0 ? C.neg : C.card2;
                return (
                  <Pressable
                    key={c}
                    onPress={() => tap(r, c)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 4,
                      backgroundColor: bg,
                      borderWidth: inA ? 2 : 1,
                      borderColor: inA ? (wt > 0 ? C.pos : C.neg) : C.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {mode === 'weights' ? <Text style={{ color: C.white, fontFamily: mono, fontSize: 11 }}>{wt > 0 ? '+1' : wt < 0 ? '−1' : '0'}</Text> : v && inA ? <Text style={{ color: C.bg, fontFamily: mono, fontSize: 10 }}>×{wt}</Text> : null}
                  </Pressable>
                );
              })}
            </Row>
          ))}
        </View>
        <Row wrap style={{ justifyContent: 'center' }}>
          {Object.keys(PRESETS).map((k) => (
            <Chip key={k} label={`digit ${k}`} active={preset === k} onPress={() => { setPreset(k); setPix(PRESETS[k].map((r) => [...r])); }} />
          ))}
          <Btn label="Clear" kind="ghost" onPress={() => { setPreset(null); setPix(EMPTY()); }} />
          <Btn label="Crossbar weights" kind="ghost" onPress={() => setW(CROSSBAR())} />
        </Row>
        <Small>{mode === 'draw' ? 'Tap cells to draw. Outlined cells are group A: the region this neuron has non-zero weights on.' : 'Tap cells to cycle a weight through 0 → +1 → −1. Design your own feature detector.'}</Small>
      </Card>

      <Card title="This neuron's activation">
        <Formula>a = ReLU( Σⱼ wⱼ aⱼ + b )</Formula>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>Group A  (weights ≠ 0, {countA} cells)</Text>
          <Text style={[st.v, { color: C.pos }]}>Σ w·a = {fmt(sumA, 0)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>Group B  (weight 0, {litB} lit pixels)</Text>
          <Text style={[st.v, { color: C.dim }]}>0 × {litB} = 0</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>bias b</Text>
          <Text style={[st.v, { color: C.warn }]}>{fmt(b, 0)}</Text>
        </Row>
        <View style={{ height: 1, backgroundColor: C.border }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={st.k}>z = {fmt(sumA, 0)} + 0 + ({fmt(b, 0)})</Text>
          <Text style={st.v}>= {fmt(z, 0)}</Text>
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[st.k, { color: high ? C.pos : C.neg, fontWeight: '700' }]}>activation ReLU(z)</Text>
          <Text style={[st.v, { color: high ? C.pos : C.neg, fontWeight: '700' }]}>= {fmt(a, 0)}  {high ? 'HIGH' : 'LOW'}</Text>
        </Row>
        <Bar value={a} max={countA + Math.min(0, b) > 0 ? countA + b : countA} color={high ? C.pos : C.neg} height={16} />
        <LabeledSlider label="bias b (the firing threshold)" value={b} min={-7} max={1} step={1} onChange={setB} color={C.warn} format={(v) => v.toFixed(0)} />
        <Small>
          The weights select a region; the activations report what is in it; the sum says whether the feature is present. Group B contributes nothing no matter what is drawn there, because 0 × anything is 0. The bias decides how many lit cells in the crossbar row it takes before the neuron fires.
        </Small>
      </Card>

      <Card title="Try the conceptual check">
        <P dim>1. Load digit 7: the whole row is lit, six products of 1 × 1, high activation.</P>
        <P dim>2. Load digit 6: only three cells of the crossbar row have ink, so the sum barely reaches the threshold set by b = −3 and the neuron stays off.</P>
        <P dim>3. Load digit 5: its top stroke sits exactly where the 7's crossbar lives. The feature is present, so the neuron fires, even though the digit is a 5. This neuron detects a feature, not a digit. Later layers combine features into digits.</P>
        <P dim>4. Load digit 1, then draw a short 7 whose crossbar sits one row lower. A plain MLP cannot cope: the crossbar lands on different input neurons. That is the motivation for convolutional networks.</P>
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  k: { color: C.text, fontFamily: mono, fontSize: 13 },
  v: { color: C.text, fontFamily: mono, fontSize: 13 },
});
