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
import { ExternalityScreen, FairnessScreen, RaceScreen, ReturnsScreen } from './screens/GovernanceScreens';

export type ConceptEntry = { key: string; title: string; definition: string; reading: string; component: ComponentType };
export type LecturePdf = { id: string; label: string };
export type Section = { lecture: string; theme: string; pdfs: LecturePdf[]; items: ConceptEntry[] };

export const SECTIONS: Section[] = [
  {
    lecture: 'Language Models',
    theme: 'From Probability to Assistant: How Language Models Work and How They Learn to Help',
    pdfs: [{ id: 'language-models-essay', label: 'Essay' }, { id: 'language-models-handout', label: 'Handout' }],
    items: [
      { key: 'loop', reading: 'I. The Model Is a Probability Engine', title: 'Autoregressive generation', definition: 'Predict P(xₜ | x₁,…,xₜ₋₁), append the chosen token, repeat.', component: LoopScreen },
      { key: 'tokens', reading: 'II. How Text Becomes Math', title: 'Tokenization and embeddings', definition: 'Text → token IDs → one-hot vectors → learned vectors in ℝᵈ.', component: TokensScreen },
      { key: 'attention', reading: 'II. How Text Becomes Math (the transformer)', title: 'Attention', definition: 'softmax(QKᵀ/√dₖ)V: each token weights the earlier tokens by learned relevance.', component: AttentionScreen },
      { key: 'softmax', reading: 'III. How Math Becomes Text Again', title: 'Softmax, temperature, and sampling', definition: 'Logits → a probability distribution → one drawn token.', component: SoftmaxScreen },
      { key: 'alignment', reading: 'IV. From Raw Predictor to Assistant', title: 'Entropy, cross-entropy, and alignment', definition: 'The training loss, and the pre-training → SFT → RLHF pipeline.', component: AlignmentScreen },
    ],
  },
  {
    lecture: 'Neural Networks',
    theme: 'Weighted Sum, Bias, Nonlinearity: ML Models and the Anatomy of a Neural Network',
    pdfs: [{ id: 'neural-networks-essay', label: 'Essay' }],
    items: [
      { key: 'neuron', reading: 'V. Anatomy of a Neural Network', title: 'The neuron', definition: 'a = σ(Σⱼ wⱼaⱼ + b): weighted sum, bias, nonlinearity.', component: NeuronScreen },
      { key: 'crossbar', reading: 'VI. The Forward Pass (conceptual check)', title: 'Feature detectors', definition: 'Why a neuron tuned to the crossbar of a 7 fires on a 5 but not a 6.', component: CrossbarScreen },
      { key: 'forward', reading: 'VI. The Forward Pass', title: 'The forward pass', definition: 'a⁽ᴸ⁾ = σ(W⁽ᴸ⁾a⁽ᴸ⁻¹⁾ + b⁽ᴸ⁾), layer by layer, in a multilayer perceptron.', component: ForwardPassScreen },
    ],
  },
  {
    lecture: 'Training',
    theme: 'Predict, Measure, Update: How Neural Networks Learn',
    pdfs: [{ id: 'training-essay', label: 'Essay' }],
    items: [
      { key: 'gradient', reading: 'III. The Update Step: Gradient Descent', title: 'Gradient descent', definition: 'θ ← θ − η∇L(θ): step against the slope of the loss.', component: GradientScreen },
      { key: 'training', reading: 'II. The Loss Function · V. The Loop in Code', title: 'Loss functions and the training loop', definition: 'Predict, measure (MSE or cross-entropy), update.', component: TrainingScreen },
    ],
  },
  {
    lecture: 'Governance',
    theme: 'General Purpose, Information, Intelligence: AI Governance and the Anatomy of a Race',
    pdfs: [{ id: 'governance-essay', label: 'Essay' }],
    items: [
      { key: 'returns', reading: 'II. Three Lenses (Lens 2: information technology)', title: 'Increasing returns', definition: 'Fixed cost F to train, marginal cost c to serve: average cost F/n + c falls without limit, so markets concentrate.', component: ReturnsScreen },
      { key: 'externality', reading: 'III. Governance and Anarchy', title: 'Externalities', definition: 'A by-product of one actor\'s behaviour on others; institutions exist to internalize them.', component: ExternalityScreen },
      { key: 'fairness', reading: 'III. Governance and Anarchy (deeply politicized issues)', title: 'Algorithmic fairness', definition: 'With different base rates and an imperfect classifier, equal false-positive rates, false-negative rates, and calibration cannot all hold.', component: FairnessScreen },
      { key: 'race', reading: 'IV. The AI Race', title: 'The AI race', definition: 'A war of attrition: rational, informed players bid risk up to E[bid] = ⅓V, and every failed assumption pushes toward the bottom.', component: RaceScreen },
    ],
  },
];
