import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Loop: undefined;
  Tokens: undefined;
  Attention: undefined;
  Softmax: undefined;
  Alignment: undefined;
  Neuron: undefined;
  Crossbar: undefined;
  ForwardPass: undefined;
  Gradient: undefined;
  Training: undefined;
};

export type ScreenName = keyof RootStackParamList;

export const useNav = () => useNavigation<NativeStackNavigationProp<RootStackParamList>>();

export type ConceptEntry = { route: ScreenName; title: string; hook: string; emoji: string };
export type Section = { lecture: string; theme: string; items: ConceptEntry[] };

export const SECTIONS: Section[] = [
  {
    lecture: 'Lecture 2',
    theme: 'How language models work',
    items: [
      { route: 'Loop', title: 'The whole machine', hook: 'Step a real next-token loop: tokenize → embed → transformer → logits → softmax → sample → append.', emoji: '🔁' },
      { route: 'Tokens', title: 'Text becomes math', hook: 'Tokenization, one-hot vectors, and the moment meaning becomes geometry.', emoji: '🔤' },
      { route: 'Attention', title: 'Attention', hook: 'Pick a query token and watch softmax(QKᵀ/√d) decide what it looks at.', emoji: '👀' },
      { route: 'Softmax', title: 'Math becomes text', hook: 'Logits, softmax, temperature, greedy vs sampling, and the NPRD glitch.', emoji: '🎲' },
      { route: 'Alignment', title: 'Predictor to assistant', hook: 'Entropy, cross-entropy, and the pre-training → SFT → RLHF pipeline.', emoji: '🧭' },
    ],
  },
  {
    lecture: 'Lecture 3',
    theme: 'Anatomy of a neural network',
    items: [
      { route: 'Neuron', title: 'One neuron', hook: 'Weighted sum, plus bias, wrapped in a nonlinearity. Turn every knob.', emoji: '⚪' },
      { route: 'Crossbar', title: 'The crossbar check', hook: 'Why a neuron trained on the bar of a 7 fires on a 5 but not on a 6.', emoji: '7️⃣' },
      { route: 'ForwardPass', title: 'The forward pass', hook: 'Propagate a tiny MLP layer by layer. Tap any neuron to see its equation.', emoji: '🕸️' },
    ],
  },
  {
    lecture: 'Lecture 4',
    theme: 'How networks learn',
    items: [
      { route: 'Gradient', title: 'Gradient descent', hook: 'Roll a ball down a foggy loss landscape. Learning rate, local minima, SGD noise.', emoji: '⛰️' },
      { route: 'Training', title: 'Predict, measure, update', hook: 'Train a line of best fit one phase at a time, and see the PyTorch loop light up.', emoji: '🔧' },
    ],
  },
];
