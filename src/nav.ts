import type { ComponentType } from 'react';
import LoopScreen from './screens/LoopScreen';
import TokensScreen from './screens/TokensScreen';
import AttentionScreen from './screens/AttentionScreen';
import SoftmaxScreen from './screens/SoftmaxScreen';
import AlignmentScreen from './screens/AlignmentScreen';
import NeuronScreen from './screens/NeuronScreen';
import CrossbarScreen from './screens/CrossbarScreen';
import ForwardPassScreen from './screens/ForwardPassScreen';
import GradientScreen from './screens/GradientScreen';
import TrainingScreen from './screens/TrainingScreen';

export type ConceptEntry = { key: string; title: string; definition: string; component: ComponentType };
export type Section = { lecture: string; theme: string; items: ConceptEntry[] };

export const SECTIONS: Section[] = [
  {
    lecture: 'Lecture 2',
    theme: 'Language models',
    items: [
      { key: 'loop', title: 'Autoregressive generation', definition: 'Predict P(xₜ | x₁,…,xₜ₋₁), append the chosen token, repeat.', component: LoopScreen },
      { key: 'tokens', title: 'Tokenization and embeddings', definition: 'Text → token IDs → one-hot vectors → learned vectors in ℝᵈ.', component: TokensScreen },
      { key: 'attention', title: 'Attention', definition: 'softmax(QKᵀ/√dₖ)V: each token weights the earlier tokens by learned relevance.', component: AttentionScreen },
      { key: 'softmax', title: 'Softmax, temperature, and sampling', definition: 'Logits → a probability distribution → one drawn token.', component: SoftmaxScreen },
      { key: 'alignment', title: 'Entropy, cross-entropy, and alignment', definition: 'The training loss, and the pre-training → SFT → RLHF pipeline.', component: AlignmentScreen },
    ],
  },
  {
    lecture: 'Lecture 3',
    theme: 'Neural networks',
    items: [
      { key: 'neuron', title: 'The neuron', definition: 'a = σ(Σⱼ wⱼaⱼ + b): weighted sum, bias, nonlinearity.', component: NeuronScreen },
      { key: 'crossbar', title: 'Feature detectors', definition: 'Why a neuron tuned to the crossbar of a 7 fires on a 5 but not a 6.', component: CrossbarScreen },
      { key: 'forward', title: 'The forward pass', definition: 'a⁽ᴸ⁾ = σ(W⁽ᴸ⁾a⁽ᴸ⁻¹⁾ + b⁽ᴸ⁾), layer by layer, in a multilayer perceptron.', component: ForwardPassScreen },
    ],
  },
  {
    lecture: 'Lecture 4',
    theme: 'Training',
    items: [
      { key: 'gradient', title: 'Gradient descent', definition: 'θ ← θ − η∇L(θ): step against the slope of the loss.', component: GradientScreen },
      { key: 'training', title: 'Loss functions and the training loop', definition: 'Predict, measure (MSE or cross-entropy), update.', component: TrainingScreen },
    ],
  },
];
