import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Bar, Btn, Card, Chip, Formula, LabeledSlider, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono, themed } from '../theme';
import { VOCAB, nextLogits, tokenId, tokenize } from '../toyLM';
import { argmax, cellColor, entropy, fmt, onFill, pseudoEmbedding, sampleIndex, softmax } from '../math';

const STAGES = [
  { label: 'Tokenize', mov: 'II' },
  { label: 'Embed + position', mov: 'II' },
  { label: 'Transformer blocks', mov: 'II' },
  { label: 'Logits', mov: 'III' },
  { label: 'Softmax', mov: 'III' },
  { label: 'Sample', mov: 'III' },
  { label: 'Append, repeat', mov: 'I' },
];

const PRESETS = ['the cat', 'the model', 'attention', 'the trophy did not'];
const TOP_K = 7;

export default function LoopScreen() {
  const [prompt, setPrompt] = useState('the cat');
  const [tokens, setTokens] = useState<string[]>(() => tokenize('the cat'));
  const [stage, setStage] = useState(0);
  const [T, setT] = useState(1);
  const [greedy, setGreedy] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [auto, setAuto] = useState(false);
  const [logP, setLogP] = useState({ sum: 0, n: 0 });

  const prev = tokens[tokens.length - 1] ?? '.';
  const logits = useMemo(() => nextLogits(prev), [prev]);
  const probs = useMemo(() => softmax(logits, T), [logits, T]);
  const order = useMemo(() => logits.map((_, i) => i).sort((a, b) => logits[b] - logits[a]), [logits]);
  const top = order.slice(0, TOP_K);

  const draw = () => (greedy ? argmax(probs) : sampleIndex(probs));

  const next = () => {
    if (stage === 4) {
      setChosen(draw());
      setStage(5);
    } else if (stage === 5) {
      const idx = chosen ?? draw();
      setTokens((t) => [...t, VOCAB[idx]]);
      setLogP((lp) => ({ sum: lp.sum + Math.log(probs[idx]), n: lp.n + 1 }));
      setStage(6);
    } else if (stage === 6) {
      setChosen(null);
      setStage(0);
    } else setStage(stage + 1);
  };
  const nextRef = useRef(next);
  nextRef.current = next;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => nextRef.current(), 800);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    if (tokens.length > 40) setAuto(false);
  }, [tokens.length]);

  const reset = (text = prompt) => {
    setAuto(false);
    setTokens(tokenize(text));
    setStage(0);
    setChosen(null);
    setLogP({ sum: 0, n: 0 });
  };

  return (
    <Screen intro="Every chatbot reply is this loop, run once per token. This is a real (tiny) language model: a bigram model built from 22 sentences. Step through it and watch the four movements close into one machine.">
      <Card>
        <Small>SEQUENCE SO FAR</Small>
        <Text style={st.seq}>
          {tokens.map((t, i) => (
            <Text key={i} style={i === tokens.length - 1 && stage === 6 ? st.seqNew : i >= tokenize(prompt).length ? st.seqGen : st.seqPrompt}>
              {t}{' '}
            </Text>
          ))}
        </Text>
        <Row style={{ justifyContent: 'space-between' }}>
          <Small>prompt · <Text style={{ color: C.accent2 }}>generated</Text> · <Text style={{ color: C.neg }}>just appended</Text></Small>
          {logP.n > 0 ? <Small>log P(generated) = {fmt(logP.sum)}</Small> : null}
        </Row>
      </Card>

      <Row wrap style={{ gap: 6 }}>
        {STAGES.map((s, i) => (
          <Pressable key={s.label} onPress={() => { setAuto(false); setStage(i); }} style={[st.stage, i === stage && st.stageActive]}>
            <Text style={[st.stageNum, i === stage && { color: C.white }]}>{i + 1}</Text>
            <Text style={[st.stageLabel, i === stage && { color: C.white }]}>{s.label}</Text>
          </Pressable>
        ))}
      </Row>

      <Card title={`${stage + 1}. ${STAGES[stage].label}  ·  movement ${STAGES[stage].mov}`}>
        {stage === 0 && <TokenizeStage tokens={tokens} />}
        {stage === 1 && <EmbedStage tokens={tokens} />}
        {stage === 2 && <TransformerStage tokens={tokens} />}
        {stage === 3 && <LogitsStage logits={logits} top={top} />}
        {stage === 4 && <SoftmaxStage probs={probs} top={top} T={T} setT={setT} />}
        {stage === 5 && (
          <SampleStage probs={probs} top={top} chosen={chosen} greedy={greedy} setGreedy={setGreedy} redraw={() => setChosen(draw())} />
        )}
        {stage === 6 && <AppendStage tokens={tokens} probs={probs} />}
      </Card>

      <Row style={{ justifyContent: 'space-between' }}>
        <Btn label={stage === 6 ? 'Loop back ↺' : 'Next step →'} onPress={() => { setAuto(false); next(); }} />
        <Btn label={auto ? 'Pause' : 'Auto-run'} kind="ghost" onPress={() => setAuto((a) => !a)} />
        <Btn label="Reset" kind="ghost" onPress={() => reset()} />
      </Row>

      <Card title="The prompt (conditioning context)">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          onSubmitEditing={() => reset(prompt)}
          placeholder="type a beginning…"
          placeholderTextColor={C.faint}
          style={st.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Row wrap>
          {PRESETS.map((p) => (
            <Chip key={p} label={p} active={p === prompt} onPress={() => { setPrompt(p); reset(p); }} />
          ))}
          <Btn label="Use prompt" kind="ghost" onPress={() => reset(prompt)} />
        </Row>
        <Small>Words outside the toy vocabulary get a near-uniform guess: the model can only continue text that resembles its training data. It mirrors the corpus.</Small>
      </Card>

      <Card title="The chain rule of probability">
        <Formula>{'P(x₁,…,xₙ) = ∏ₜ P(xₜ | x₍<t₎)'}</Formula>
        <P dim>**Sampling** one token at a time from P(xₜ | everything before) is exactly sampling the whole sequence from the joint distribution. The **chain rule** is why the humble loop is principled, and why after a bad draw the model can still steer back: the next prediction conditions on the full **context**.</P>
      </Card>
    </Screen>
  );
}

function TokenizeStage({ tokens }: { tokens: string[] }) {
  return (
    <View style={{ gap: S.md }}>
      <P>Text is chopped into **tokens** and each is mapped to an ID in a fixed vocabulary. The model never sees letters, only these IDs.</P>
      <Row wrap>
        {tokens.map((t, i) => {
          const id = tokenId(t);
          return <Chip key={i} label={t} sub={id >= 0 ? `id ${id}` : 'unknown'} color={id >= 0 ? C.accent : C.neg} active={id < 0} />;
        })}
      </Row>
      <Small>Vocabulary size V = {VOCAB.length} here; real models use ~50,000 to 200,000 sub-word tokens.</Small>
    </View>
  );
}

function EmbedStage({ tokens }: { tokens: string[] }) {
  const shown = tokens.slice(-5);
  const offset = tokens.length - shown.length;
  return (
    <View style={{ gap: S.md }}>
      <P>Each ID becomes a learned vector (an **embedding**), and a **positional embedding** is added so the model knows word order.</P>
      {shown.map((t, i) => {
        const e = pseudoEmbedding(t);
        const pos = e.map((_, k) => Math.sin((offset + i + 1) / Math.pow(30, k / e.length)));
        return (
          <View key={i} style={{ gap: 2 }}>
            <Row>
              <Text style={st.tokLabel}>{t}</Text>
              <VecCells v={e} />
            </Row>
            <Row>
              <Text style={[st.tokLabel, { color: C.dim }]}>+ pos {offset + i + 1}</Text>
              <VecCells v={pos} />
            </Row>
          </View>
        );
      })}
      <Small>Illustrative 8-dim vectors; real embeddings have d ≈ 1,000–3,000. In a trained model, related tokens end up near each other and directions carry relationships (king − man + woman ≈ queen).</Small>
    </View>
  );
}

function TransformerStage({ tokens }: { tokens: string[] }) {
  const n = tokens.length;
  const last = pseudoEmbedding(tokens[n - 1]);
  const scores = tokens.map((t, i) => {
    const e = pseudoEmbedding(t);
    const sim = e.reduce((s, v, k) => s + v * last[k], 0);
    return 1.5 * sim - 0.25 * (n - 1 - i);
  });
  const w = softmax(scores);
  return (
    <View style={{ gap: S.md }}>
      <P>A stack of identical blocks. In each, **attention** lets the current position gather information from earlier positions by learned relevance, then a feed-forward layer processes each position on its own.</P>
      <Small>Attention weights from the last token "{tokens[n - 1]}" back over the context (illustrative):</Small>
      {tokens.slice(-8).map((t, j) => {
        const i = n - Math.min(8, n) + j;
        return <Bar key={i} label={t} value={w[i]} color={C.accent2} right={`${(w[i] * 100).toFixed(0)}%`} />;
      })}
      <Formula>Attention(Q,K,V) = softmax(QKᵀ/√dₖ) V</Formula>
      <Small>Repeat the block dozens of times and the final position's vector is ready to be turned into scores over the vocabulary. The Attention screen shows the Q, K, V mechanics in full.</Small>
    </View>
  );
}

function LogitsStage({ logits, top }: { logits: number[]; top: number[] }) {
  const vals = top.map((i) => logits[i]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  return (
    <View style={{ gap: S.md }}>
      <P>The transformer emits one raw score per vocabulary entry. **Logits** can be negative and do not sum to one; they are the model's unnormalized opinion.</P>
      {top.map((i) => (
        <Bar key={i} label={VOCAB[i]} value={logits[i] - lo + 0.3} max={hi - lo + 0.3} color={C.warn} right={fmt(logits[i])} />
      ))}
      <Small>Top {TOP_K} of V = {VOCAB.length} shown. In this toy the logit is log(count + 0.01), so unseen continuations sit near −4.6.</Small>
    </View>
  );
}

function SoftmaxStage({ probs, top, T, setT }: { probs: number[]; top: number[]; T: number; setT: (v: number) => void }) {
  const sum = probs.reduce((a, b) => a + b, 0);
  return (
    <View style={{ gap: S.md }}>
      <P>**Softmax** exponentiates every logit and normalizes so the scores sum to one. Now we have a genuine distribution. **Temperature** divides the logits first: low sharpens, high flattens.</P>
      <Formula>P(xᵢ) = e^(zᵢ/T) / Σⱼ e^(zⱼ/T)</Formula>
      <LabeledSlider label="Temperature T" value={T} min={0.1} max={3} step={0.05} onChange={setT} color={C.warn} />
      {top.map((i) => (
        <Bar key={i} label={VOCAB[i]} value={probs[i]} color={C.accent} right={`${(probs[i] * 100).toFixed(1)}%`} />
      ))}
      <Row style={{ justifyContent: 'space-between' }}>
        <Small>Σ P = {fmt(sum, 3)}</Small>
        <Small>entropy H = {fmt(entropy(probs))} nats</Small>
      </Row>
      <FullPMF probs={probs} />
      <Small>The whole distribution: all V = {VOCAB.length} probabilities, sorted, on a log scale. The head is the handful of plausible continuations; the long tail is every other token, each unlikely but never zero. Sampling occasionally lands in the tail, which is where glitches come from and what top-k and top-p sampling cut off.</Small>
    </View>
  );
}

function SampleStage({ probs, top, chosen, greedy, setGreedy, redraw }: { probs: number[]; top: number[]; chosen: number | null; greedy: boolean; setGreedy: (g: boolean) => void; redraw: () => void }) {
  const inTop = chosen !== null && top.includes(chosen);
  return (
    <View style={{ gap: S.md }}>
      <P>Roll the die. **Greedy** always takes the arg max; sampling draws from the distribution, which is why the same **prompt** can give different replies.</P>
      <Row>
        <Chip label="Sample  xₜ ~ P" active={!greedy} onPress={() => setGreedy(false)} />
        <Chip label="Greedy  arg max" active={greedy} onPress={() => setGreedy(true)} />
        <Btn label="Redraw" kind="ghost" onPress={redraw} />
      </Row>
      {top.map((i) => (
        <Bar key={i} label={VOCAB[i]} value={probs[i]} color={i === chosen ? C.pos : C.faint} right={`${(probs[i] * 100).toFixed(1)}%`} />
      ))}
      {chosen !== null && (
        <View style={st.drawBox}>
          <Text style={st.drawText}>
            drew <Text style={{ color: C.pos, fontWeight: '700' }}>{VOCAB[chosen]}</Text> with P = {(probs[chosen] * 100).toFixed(1)}%
          </Text>
          {!inTop && <Small style={{ color: C.neg }}>A low-probability draw from outside the top {TOP_K}: the "NPRD" moment. Watch whether the model recovers on the next steps.</Small>}
        </View>
      )}
    </View>
  );
}

function AppendStage({ tokens, probs }: { tokens: string[]; probs: number[] }) {
  return (
    <View style={{ gap: S.md }}>
      <P>The drawn token is appended to the context and the loop starts over. Every later prediction is conditioned on the new, longer sequence, so a mistake gets absorbed rather than repeated.</P>
      <Text style={st.seq}>
        {tokens.slice(0, -1).join(' ')} <Text style={st.seqNew}>{tokens[tokens.length - 1]}</Text> <Text style={{ color: C.faint }}>▮</Text>
      </Text>
      <Small>Context length {tokens.length} tokens. Real models stop when they sample an end-of-sequence token or hit the context window.</Small>
    </View>
  );
}

function FullPMF({ probs }: { probs: number[] }) {
  const W = 320, H = 110, pad = 26;
  const sorted = [...probs].sort((a, b) => b - a);
  const lo = Math.log10(Math.max(1e-4, sorted[sorted.length - 1])), hi = 0;
  const bw = (W - pad - 6) / sorted.length;
  const Y = (p: number) => H - 16 - ((Math.log10(Math.max(1e-4, p)) - lo) / (hi - lo)) * (H - 26);
  return (
    <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
      {[1, 0.1, 0.01].map((t) => (
        <React.Fragment key={t}>
          <Line x1={pad} y1={Y(t)} x2={W - 6} y2={Y(t)} stroke={C.border} />
          <SvgText x={pad - 3} y={Y(t) + 3} fill={C.dim} fontSize={8} fontFamily={mono} textAnchor="end">{t}</SvgText>
        </React.Fragment>
      ))}
      {sorted.map((p, i) => (
        <Rect key={i} x={pad + i * bw} y={Y(p)} width={Math.max(1, bw - 1)} height={H - 16 - Y(p)} fill={i < TOP_K ? C.forest : C.accent2} />
      ))}
      <SvgText x={W - 6} y={H - 4} fill={C.dim} fontSize={8} fontFamily={mono} textAnchor="end">tokens sorted by P (log scale)</SvgText>
    </Svg>
  );
}

function VecCells({ v }: { v: number[] }) {
  return (
    <Row style={{ gap: 3 }}>
      {v.map((x, k) => (
        <View key={k} style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: cellColor(x), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: onFill(x), fontSize: 8, fontFamily: mono }}>{x.toFixed(1)}</Text>
        </View>
      ))}
    </Row>
  );
}

const st = themed(() => StyleSheet.create({
  seq: { color: C.text, fontFamily: mono, fontSize: 15, lineHeight: 24 },
  seqPrompt: { color: C.text },
  seqGen: { color: C.accent2 },
  seqNew: { color: C.neg, fontWeight: '700' },
  stage: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stageActive: { backgroundColor: C.forest, borderColor: C.forest },
  stageNum: { color: C.accent, fontFamily: mono, fontSize: 12, fontWeight: '700' },
  stageLabel: { color: C.dim, fontSize: 12 },
  tokLabel: { color: C.text, fontFamily: mono, fontSize: 12, width: 64 },
  drawBox: { backgroundColor: C.card2, borderRadius: 10, padding: S.md, gap: 4 },
  drawText: { color: C.text, fontSize: 15 },
  input: {
    backgroundColor: C.card2,
    color: C.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: mono,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
}));
