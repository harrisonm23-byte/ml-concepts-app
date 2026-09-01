import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Card, Chip, Formula, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono } from '../theme';
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

// Hand-placed 2-D embedding map. Coordinates in [0,1].
const WORDS: Record<string, [number, number]> = {
  man: [0.28, 0.30], woman: [0.28, 0.66], king: [0.62, 0.30], queen: [0.62, 0.66],
  prince: [0.74, 0.20], princess: [0.74, 0.76],
  cat: [0.10, 0.90], kitten: [0.19, 0.95], dog: [0.06, 0.78], puppy: [0.15, 0.83],
  car: [0.86, 0.92], truck: [0.80, 0.97], carburetor: [0.95, 0.96],
};
const NAMES = Object.keys(WORDS);
const dist = (a: string, b: string) => Math.hypot(WORDS[a][0] - WORDS[b][0], WORDS[a][1] - WORDS[b][1]);

export default function TokensScreen() {
  const [text, setText] = useState("The transformer unbelievably counts strawberries.");
  const toks = useMemo(() => toyTokenize(text), [text]);
  const [hot, setHot] = useState(2);
  const [hot2, setHot2] = useState(5);
  const [sel, setSel] = useState('king');
  const [analogy, setAnalogy] = useState(true);
  const chars = text.replace(/\s/g, '').length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const W = 320, H = 260;
  const px = (n: string) => 20 + WORDS[n][0] * (W - 40);
  const py = (n: string) => 20 + WORDS[n][1] * (H - 40);
  const nearest = NAMES.filter((n) => n !== sel).sort((a, b) => dist(sel, a) - dist(sel, b)).slice(0, 3);
  // king - man + woman: draw arrow man→king, then same arrow from woman.
  const dx = px('king') - px('man'), dy = py('king') - py('man');

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
        <Small>Tokens are usually word fragments (byte-pair encoding builds a vocabulary of common character sequences). Two everyday quirks follow: context windows are measured in tokens, and a model asked to count the r's in "strawberry" sees a few IDs, not ten letters. ▁ marks a token that starts a word.</Small>
      </Card>

      <Card title="2. One-hot encoding (the problem)">
        <P>The crudest numeric form of a token ID: a vector of zeros with a single 1 at the ID's position. Tap two positions.</P>
        <Row wrap style={{ gap: 4 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Chip key={i} label={i === hot ? '1' : i === hot2 ? '1' : '0'} active={i === hot || i === hot2} color={i === hot ? C.accent : C.accent2} onPress={() => (i === hot ? setHot2(i) : setHot(i))} />
          ))}
        </Row>
        <Formula>e{sub(hot)} · e{sub(hot2)} = {hot === hot2 ? '1' : '0'}</Formula>
        <Small>Every pair of distinct one-hot vectors is orthogonal, so "cat" is exactly as far from "kitten" as from "carburetor". And with V ≈ 50,000 the vectors are enormous. One-hot is best understood as the problem embeddings solve. (An embedding layer is literally eₖᵀW: a lookup of row k in a learned matrix W.)</Small>
      </Card>

      <Card title="3. Embeddings (the solution)">
        <P>Each token is mapped to a learned point in a continuous space. Tap a word to see its nearest neighbours.</P>
        <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
          {analogy && (
            <>
              <Line x1={px('man')} y1={py('man')} x2={px('king')} y2={py('king')} stroke={C.warn} strokeWidth={2} />
              <Line x1={px('woman')} y1={py('woman')} x2={px('woman') + dx} y2={py('woman') + dy} stroke={C.warn} strokeWidth={2} strokeDasharray="5,4" />
              <Circle cx={px('woman') + dx} cy={py('woman') + dy} r={9} fill="none" stroke={C.warn} strokeWidth={2} />
            </>
          )}
          {nearest.map((n) => (
            <Line key={n} x1={px(sel)} y1={py(sel)} x2={px(n)} y2={py(n)} stroke={C.accent} strokeWidth={1} strokeDasharray="3,3" />
          ))}
          {NAMES.map((n) => (
            <React.Fragment key={n}>
              <Circle cx={px(n)} cy={py(n)} r={n === sel ? 7 : 5} fill={n === sel ? C.accent : nearest.includes(n) ? C.accent2 : C.dim} onPress={() => setSel(n)} />
              <SvgText x={px(n) + 8} y={py(n) - 6} fill={C.text} fontSize={11} fontFamily={mono} onPress={() => setSel(n)}>{n}</SvgText>
            </React.Fragment>
          ))}
        </Svg>
        <Row wrap>
          {NAMES.map((n) => <Chip key={n} label={n} active={n === sel} onPress={() => setSel(n)} />)}
        </Row>
        <Small>Nearest to <Text style={{ color: C.accent }}>{sel}</Text>: {nearest.map((n) => `${n} (${fmt(dist(sel, n))})`).join(', ')}</Small>
        <Row>
          <Chip label={analogy ? 'hide king − man + woman' : 'show king − man + woman'} active={analogy} color={C.warn} onPress={() => setAnalogy(!analogy)} />
        </Row>
        <Formula>v_king − v_man + v_woman ≈ v_queen</Formula>
        <Small>The solid arrow is the displacement man → king. Copy that same arrow onto woman (dashed) and it lands on queen: one direction in the space encodes royalty, independent of gender. Nobody told the model this; it fell out of predicting the next token.</Small>
      </Card>

      <Card title="4. Positional embeddings (order)">
        <Row style={{ justifyContent: 'space-between' }}>
          <OrderDemo words={['the', 'cat', 'chased', 'the', 'dog']} />
          <OrderDemo words={['the', 'dog', 'chased', 'the', 'cat']} />
        </Row>
        <Small>Both sentences contain the identical multiset of token IDs and mean opposite things. A positional embedding (absolute or relative) is added to each token's vector so the model can tell position 2 from position 5.</Small>
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
      <Text style={{ color: C.text, fontSize: 22, fontWeight: '700', fontFamily: mono }}>{n}</Text>
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

const st = StyleSheet.create({
  input: { backgroundColor: C.card2, color: C.text, borderRadius: 10, padding: 10, fontSize: 15, borderWidth: 1, borderColor: C.border, minHeight: 44 },
  tok: { backgroundColor: C.card2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tokStart: { borderColor: C.accent + '88' },
  tokText: { color: C.text, fontFamily: mono, fontSize: 13 },
  tokId: { color: C.faint, fontFamily: mono, fontSize: 9 },
});
