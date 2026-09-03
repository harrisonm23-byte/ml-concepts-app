import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import VectorSpace3D from '../components/VectorSpace3D';
import { addv, cosine, pca, project, sub as vsub, mulberry32 } from '../math';
import { Bar, Card, Chip, Formula, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono, themed } from '../theme';
import { fmt, hashStr } from '../math';

// A toy byte-pair-ish tokenizer: whole short words, common suffixes split off,
// long stems chunked. Enough to show that tokens are fragments, not words.
const SUFFIXES = ['ation', 'tion', 'ness', 'ment', 'able', 'ing', 'ed', 'ly', 'er', 'es', 's'];
function tokenizeWord(word: string): string[] {
  const out: string[] = [];
  let w = word;
  let suffix: string | null = null;
  for (const s of SUFFIXES) {
    if (w.length > s.length + 3 && w.endsWith(s)) {
      suffix = s;
      w = w.slice(0, -s.length);
      break;
    }
  }
  while (w.length > 5) {
    out.push(w.slice(0, 4));
    w = w.slice(4);
  }
  if (w) out.push(w);
  if (suffix) out.push(suffix);
  return out;
}
export function toyTokenize(text: string): { text: string; id: number; wordStart: boolean }[] {
  const parts = text.match(/[A-Za-z0-9']+|[^\sA-Za-z0-9']/g) ?? [];
  const toks: { text: string; id: number; wordStart: boolean }[] = [];
  for (const p of parts) {
    const pieces = /[A-Za-z0-9']/.test(p) ? tokenizeWord(p) : [p];
    pieces.forEach((piece, i) => toks.push({ text: piece, id: hashStr(piece.toLowerCase()) % 50257, wordStart: i === 0 }));
  }
  return toks;
}

// Toy 8-dimensional embeddings. Axes are interpretable here for teaching
// (royal, male, female, human, animal, young, vehicle, machine) plus a little
// deterministic noise; in a real model the axes are learned and uninterpretable.
const FEATS = ['royal', 'male', 'female', 'human', 'animal', 'young', 'vehicle', 'machine'];
const RAW: Record<string, number[]> = {
  king:       [1, 1, 0, 1, 0, 0, 0, 0],
  queen:      [1, 0, 1, 1, 0, 0, 0, 0],
  man:        [0, 1, 0, 1, 0, 0, 0, 0],
  woman:      [0, 0, 1, 1, 0, 0, 0, 0],
  prince:     [1, 1, 0, 1, 0, 1, 0, 0],
  princess:   [1, 0, 1, 1, 0, 1, 0, 0],
  boy:        [0, 1, 0, 1, 0, 1, 0, 0],
  girl:       [0, 0, 1, 1, 0, 1, 0, 0],
  cat:        [0, 0, 0, 0, 1, 0, 0, 0],
  kitten:     [0, 0, 0, 0, 1, 1, 0, 0],
  dog:        [0, 0, 0, 0, 1, 0, 0, 0.1],
  puppy:      [0, 0, 0, 0, 1, 1, 0, 0.1],
  car:        [0, 0, 0, 0, 0, 0, 1, 0.6],
  truck:      [0, 0, 0, 0, 0, 0, 1, 0.7],
  carburetor: [0, 0, 0, 0, 0, 0, 0.4, 1],
};
const WORDS: Record<string, number[]> = Object.fromEntries(
  Object.entries(RAW).map(([w, v]) => {
    const rnd = mulberry32(w.length * 131 + w.charCodeAt(0));
    return [w, v.map((x) => x + (rnd() - 0.5) * 0.12)];
  }),
);
const NAMES = Object.keys(WORDS);
const PCA = pca(NAMES.map((n) => WORDS[n]), 3);
const P3 = (v: number[]) => project(v, PCA.mean, PCA.comps) as [number, number, number];
const explained = PCA.variance.reduce((a, b) => a + b, 0) / (() => {
  const rows = NAMES.map((n) => WORDS[n]);
  const d = rows[0].length;
  const mean = PCA.mean;
  let tot = 0;
  for (let j = 0; j < d; j++) tot += rows.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / rows.length;
  return tot;
})();

export default function TokensScreen() {
  const [text, setText] = useState("The transformer unbelievably counts strawberries.");
  const toks = useMemo(() => toyTokenize(text), [text]);
  const [hot, setHot] = useState(2);
  const [hot2, setHot2] = useState(5);
  const [sel, setSel] = useState('king');
  const [analogy, setAnalogy] = useState(true);
  const chars = text.replace(/\s/g, '').length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const sims = NAMES.filter((n) => n !== sel).map((n) => ({ n, c: cosine(WORDS[sel], WORDS[n]) })).sort((a, b) => b.c - a.c);
  const nearest = sims.slice(0, 3).map((x) => x.n);
  // king − man + woman, computed in the full 8-D space, then projected like everything else.
  const analogyVec = addv(vsub(WORDS.king, WORDS.man), WORDS.woman);
  const analogyBest = NAMES.map((n) => ({ n, c: cosine(analogyVec, WORDS[n]) })).sort((a, b) => b.c - a.c)[0];
  const items = NAMES.map((n) => ({ name: n, p: P3(WORDS[n]), color: n === sel ? C.forest : nearest.includes(n) ? C.accent2 : C.dim }));
  const arrows = analogy
    ? [
        { from: P3(WORDS.man), to: P3(WORDS.king), color: C.warn, label: 'king − man' },
        { from: P3(WORDS.woman), to: P3(analogyVec), color: C.neg, dashed: true, label: '+ woman' },
      ]
    : [];

  return (
    <Screen intro="Neural networks compute with numbers, not words. Three steps turn text into vectors: tokenize, encode, and embed. The last one is where meaning becomes geometry.">
      <Card title="1. Tokenization">
        <TextInput value={text} onChangeText={setText} style={st.input} multiline autoCorrect={false} />
        <Row wrap style={{ gap: 6 }}>
          {toks.map((t, i) => (
            <View key={i} style={[st.tok, t.wordStart && st.tokStart]}>
              <Text style={st.tokText}>{t.wordStart ? '▁' : ''}{t.text}</Text>
              <Text style={st.tokId}>{t.id}</Text>
            </View>
          ))}
        </Row>
        <Row style={{ justifyContent: 'space-around' }}>
          <Stat n={chars} label="characters" />
          <Stat n={words} label="words" />
          <Stat n={toks.length} label="tokens" />
        </Row>
        <Small>Tokens are usually word fragments (**byte-pair encoding** builds a vocabulary of common character sequences). Two everyday quirks follow: context windows are measured in tokens, and a model asked to count the r's in "strawberry" sees a few IDs, not ten letters. ▁ marks a token that starts a word.</Small>
      </Card>

      <Card title="2. One-hot encoding">
        <P>The crudest numeric form of a token ID: a vector of zeros with a single 1 at the ID's position. Tap two positions.</P>
        <Row wrap style={{ gap: 4 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Chip key={i} label={i === hot ? '1' : i === hot2 ? '1' : '0'} active={i === hot || i === hot2} color={i === hot ? C.accent : C.accent2} onPress={() => (i === hot ? setHot2(i) : setHot(i))} />
          ))}
        </Row>
        <Formula>e{sub(hot)} · e{sub(hot2)} = {hot === hot2 ? '1' : '0'}</Formula>
        <Small>Every pair of distinct one-hot vectors is **orthogonal**, so "cat" is exactly as far from "kitten" as from "carburetor". And with V ≈ 50,000 the vectors are enormous. One-hot is best understood as the problem embeddings solve. (An **embedding** layer is literally eₖᵀW: a lookup of row k in a learned matrix W.)</Small>
      </Card>

      <Card title="3. Embeddings">
        <P>Each token is a vector: an arrow from the origin in a d-dimensional space. Here d = 8 so you can read every coordinate. To draw it we project onto the three **principal components** (PCA), the same thing the TensorFlow Embedding Projector does. Drag to rotate.</P>
        <VectorSpace3D items={items} arrows={arrows} selected={sel} onSelect={setSel} />
        <Small>Depth cues: nearer points are larger and darker. The three axes PC1–PC3 capture {(explained * 100).toFixed(0)}% of the variance of these 15 vectors; the remaining {(100 - explained * 100).toFixed(0)}% is invisible in any 3-D picture. Nothing above three dimensions can be drawn; you visualize three and say "eight" to yourself loudly.</Small>
        <Row wrap>
          {NAMES.map((n) => <Chip key={n} label={n} active={n === sel} onPress={() => setSel(n)} />)}
        </Row>
        <Formula>{`v_${sel} = [${WORDS[sel].map((x) => x.toFixed(2)).join(', ')}]`}</Formula>
        <Row wrap style={{ gap: 4 }}>
          {FEATS.map((f) => <Small key={f} style={{ fontFamily: 'Menlo', fontSize: 10 }}>{f}</Small>)}
        </Row>
        <P dim>Relatedness is measured in the full space, not the picture. The standard measure is **cosine similarity**, the cosine of the angle between two arrows:</P>
        <Formula>cos θ = (u · v) / (‖u‖ ‖v‖)</Formula>
        {sims.slice(0, 5).map((x) => (
          <Bar key={x.n} label={x.n} value={Math.max(0, x.c)} color={nearest.includes(x.n) ? C.accent2 : C.dim} right={x.c.toFixed(3)} />
        ))}
        <Small>1 means the same direction, 0 means orthogonal (like one-hot vectors), −1 means opposite. Two arrows can look close in a projection and be far apart in the full space, which is why tools compute neighbours from the real vectors and only draw the projection.</Small>
        <Row>
          <Chip label={analogy ? 'hide king − man + woman' : 'show king − man + woman'} active={analogy} color={C.warn} onPress={() => setAnalogy(!analogy)} />
        </Row>
        <Formula>v_king − v_man + v_woman ≈ v_queen</Formula>
        <Small>Vector arithmetic, done on the 8-D vectors: the solid arrow is the displacement man → king (it isolates the "royal" direction); adding it to woman lands at the dashed arrowhead. Nearest real token to that point: <Text style={{ color: C.forest, fontWeight: '600' }}>{analogyBest.n}</Text> (cosine {analogyBest.c.toFixed(3)}). In the real model no one labels an axis "royal"; it falls out of next-token prediction.</Small>
      </Card>

      <Card title="4. Positional embeddings">
        <Row style={{ justifyContent: 'space-between' }}>
          <OrderDemo words={['the', 'cat', 'chased', 'the', 'dog']} />
          <OrderDemo words={['the', 'dog', 'chased', 'the', 'cat']} />
        </Row>
        <Small>Both sentences contain the identical multiset of token IDs and mean opposite things. A **positional embedding** (absolute or relative) is added to each token's vector so the model can tell position 2 from position 5.</Small>
      </Card>
    </Screen>
  );
}

function sub(i: number) {
  return '₀₁₂₃₄₅₆₇₈₉'.split('')[i % 10];
}
function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: C.forest, fontSize: 24, fontWeight: '600', fontFamily: 'Georgia' }}>{n}</Text>
      <Small>{label}</Small>
    </View>
  );
}
function Stat3({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[{ flexDirection: 'row' }, style]}>{children}</View>;
}
function OrderDemo({ words }: { words: string[] }) {
  return (
    <View style={{ gap: 3 }}>
      {words.map((w, i) => (
        <Row key={i} style={{ gap: 6 }}>
          <Text style={{ color: C.dim, fontFamily: mono, fontSize: 11, width: 36 }}>pos {i + 1}</Text>
          <Text style={{ color: C.text, fontFamily: mono, fontSize: 12, width: 52 }}>{w}</Text>
          <Text style={{ color: C.faint, fontFamily: mono, fontSize: 11 }}>{hashStr(w) % 50257}</Text>
        </Row>
      ))}
    </View>
  );
}

const st = themed(() => StyleSheet.create({
  input: { backgroundColor: C.card2, color: C.text, borderRadius: 10, padding: 10, fontSize: 15, borderWidth: 1, borderColor: C.border, minHeight: 44 },
  tok: { backgroundColor: C.card2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tokStart: { borderColor: C.accent + '88' },
  tokText: { color: C.text, fontFamily: mono, fontSize: 13 },
  tokId: { color: C.faint, fontFamily: mono, fontSize: 9 },
}));
