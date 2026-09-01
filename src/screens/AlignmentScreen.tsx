import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bar, Btn, Card, Chip, Formula, LabeledSlider, P, Row, Screen, Small } from '../components/ui';
import { C, S, mono } from '../theme';
import { entropy, fmt } from '../math';

const STAGES = ['Base (pre-trained)', 'SFT', 'RLHF'] as const;
const PROMPT = 'What is the capital of France?';
const RESPONSES = [
  'What is the capital of Germany?\nWhat is the capital of Spain?\nWhat is the capital of Italy?\n…',
  'The capital of France is Paris.',
  'The capital of France is Paris. It has been the seat of government since the 10th century. Anything else I can help with?',
];

// Entropy examples. One die: uniform over 6. Two dice summed: 11 outcomes, peaked at 7.
const ONE_DIE = Array(6).fill(1 / 6);
const TWO_DICE = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((c) => c / 36);
const UNIFORM_11 = Array(11).fill(1 / 11);

export default function AlignmentScreen() {
  const [stage, setStage] = useState(0);
  const [pref, setPref] = useState<'A' | 'B' | null>(null);
  const [beta, setBeta] = useState(0.5);
  const drift = 1 / (1 + 3 * beta);

  return (
    <Screen intro="A model trained only to predict the next token of internet text is not an assistant. Ask it a question and it may continue with more questions, because on the internet, questions come in lists. Alignment closes the gap.">
      <Card title="Three stages, one prompt">
        <Row wrap>
          {STAGES.map((s, i) => (
            <Chip key={s} label={`${i + 1}. ${s}`} active={i === stage} onPress={() => setStage(i)} />
          ))}
        </Row>
        <View style={st.bubbleUser}><Text style={st.bubbleText}>{PROMPT}</Text></View>
        <View style={[st.bubbleModel, stage === 0 && { borderColor: C.neg }]}><Text style={st.bubbleText}>{RESPONSES[stage]}</Text></View>
        {stage === 0 && <Small>Pre-training: internet-scale next-token prediction with cross-entropy loss. Essentially all knowledge and capability comes from here. But it is a text continuer, with no persona, no refusals, no assistant format.</Small>}
        {stage === 1 && <Small>Supervised fine-tuning: continue training on human-written demonstrations of good assistant behaviour (question, helpful answer). Same loop as pre-training, different data. It teaches the format of being an assistant.</Small>}
        {stage === 2 && <Small>Reinforcement learning from human feedback: humans rank pairs of outputs, a reward model learns to predict the rankings, and the policy is optimized to score well while a KL penalty keeps it near the SFT model.</Small>}
      </Card>

      <Card title="RLHF: rank a pair, train a reward model">
        <P dim>Which reply do you prefer?</P>
        <Row style={{ alignItems: 'stretch' }}>
          <Choice label="A" text="Paris." active={pref === 'A'} onPress={() => setPref('A')} />
          <Choice label="B" text="The capital of France is Paris. Anything else?" active={pref === 'B'} onPress={() => setPref('B')} />
        </Row>
        <Bar label="r(x, A)" value={pref === 'A' ? 0.8 : pref === 'B' ? 0.35 : 0.5} color={C.accent2} right={pref ? (pref === 'A' ? '0.80' : '0.35') : '0.50'} />
        <Bar label="r(x, B)" value={pref === 'B' ? 0.8 : pref === 'A' ? 0.35 : 0.5} color={C.accent2} right={pref ? (pref === 'B' ? '0.80' : '0.35') : '0.50'} />
        <Formula>max_θ  E[ r(x, y) ]  −  β · KL(π_θ ‖ π_SFT)</Formula>
        <LabeledSlider label="β (KL penalty weight)" value={beta} min={0} max={2} step={0.05} onChange={setBeta} color={C.warn} />
        <Bar label="drift from SFT" value={drift} color={C.warn} right={fmt(drift)} />
        <Small>Your one ranking nudges the reward model (illustrative numbers). Thousands of rankings from large labeler workforces train the real one, and whose preferences they encode is both a labour-ethics question and an epistemic one: the reward model defines what "helpful" means. β = 0 lets the policy chase reward anywhere, including into degenerate text; large β pins it to the SFT model. DPO reaches similar results with no separate reward model at all: your language model is secretly a reward model.</Small>
      </Card>

      <Card title="Base vs aligned: why jailbreaks work">
        <Row style={{ alignItems: 'stretch' }}>
          <View style={[st.layer, { backgroundColor: C.accent + '22', borderColor: C.accent, flex: 3 }]}>
            <Text style={st.layerTitle}>Base model</Text>
            <Small>capability, knowledge, every style on the internet</Small>
          </View>
          <View style={[st.layer, { backgroundColor: C.pos + '22', borderColor: C.pos, flex: 1 }]}>
            <Text style={st.layerTitle}>SFT + RLHF</Text>
            <Small>format, persona, refusals</Small>
          </View>
        </Row>
        <Small>Capability lives in the base model; safety behaviour is a layer added afterwards. A jailbreak teaches the model nothing new: it finds a path around the layer to capabilities the base model always had. The superficial alignment hypothesis pushes this to its end (alignment only chooses what to surface and in what style); whether it holds in full is open, and reasoning models trained with RL on verifiable rewards look like a counterexample where post-training adds capability, not just style.</Small>
      </Card>

      <Card title="Entropy: the uncertainty in a distribution">
        <Formula>H(p) = −Σᵢ p(xᵢ) log p(xᵢ)</Formula>
        <Dist label="one fair die (6 outcomes)" p={ONE_DIE} />
        <Dist label="sum of two dice (11 outcomes, peaked at 7)" p={TWO_DICE} />
        <Dist label="uniform over 2…12 (11 outcomes)" p={UNIFORM_11} />
        <Small>Concentrated distributions have low entropy; spread-out ones have high entropy. Note the actual numbers: the sum of two dice is peaked, so it has less entropy than a uniform over the same 11 outcomes (2.27 vs 2.40 nats), but more than a single die, which only has 6 outcomes (1.79). Your notes compare it to the single die; the fair comparison is to the uniform with the same support.</Small>
        <Formula>H(p, q) = −Σᵢ p(xᵢ) log q(xᵢ)</Formula>
        <Small>Cross-entropy compares a predicted distribution q against the true one p, and it is not merely related to training: it is the training loss. With all true mass on the observed token, it collapses to −log q(x*), the negative log-probability the model gave the correct token.</Small>
      </Card>
    </Screen>
  );
}

function Choice({ label, text, active, onPress }: { label: string; text: string; active: boolean; onPress: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Chip label={`${label}: ${text}`} active={active} color={C.pos} onPress={onPress} />
    </View>
  );
}

function Dist({ label, p }: { label: string; p: number[] }) {
  const max = Math.max(...p);
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Small>{label}</Small>
        <Text style={{ color: C.accent, fontFamily: mono, fontSize: 12 }}>H = {fmt(entropy(p))} nats</Text>
      </Row>
      <Row style={{ gap: 3, alignItems: 'flex-end', height: 40 }}>
        {p.map((v, i) => (
          <View key={i} style={{ flex: 1, height: 6 + (v / max) * 34, backgroundColor: C.accent, borderRadius: 3, opacity: 0.5 + 0.5 * (v / max) }} />
        ))}
      </Row>
    </View>
  );
}

const st = StyleSheet.create({
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: C.accent, borderRadius: 14, padding: 10, maxWidth: '85%' },
  bubbleModel: { alignSelf: 'flex-start', backgroundColor: C.card2, borderRadius: 14, padding: 10, maxWidth: '90%', borderWidth: 1, borderColor: C.border },
  bubbleText: { color: C.text, fontSize: 14, lineHeight: 20 },
  layer: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  layerTitle: { color: C.text, fontWeight: '700', fontSize: 14 },
});
