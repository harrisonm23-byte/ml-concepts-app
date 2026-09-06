# Machine Learning: Interactive Notes

An Expo / React Native app that is a companion to a set of course essays on machine learning
(lectures 2–4). It runs on iPhone, Android, and in the browser from one codebase.

The whole app is a single scrolling page. It opens with a header, a one-paragraph abstract, and then
three lecture sections. Each section holds a handful of **entries**: a definition from the course
(heading, one-line formula, and a citation to the essay section it reads with), followed by a
demonstration you can operate. Entries are collapsible accordion rows and all start open, so the
page reads top to bottom like the essays. Every number on screen is computed live from the stated
formula; the models are small enough to see through.

There is no navigation stack and no per-concept route. Ten concept screens are rendered inline
inside the accordion, in the order listed in `src/nav.ts`.

## What is on the page

### Language Models · From Probability to Assistant: How Language Models Work and How They Learn to Help

**Autoregressive generation** (`LoopScreen`) — *Predict P(xₜ | x₁,…,xₜ₋₁), append the chosen token, repeat.*
A real, tiny language model: a bigram model built from a hand-written corpus of 22 sentences
(`src/toyLM.ts`), where logits are log-counts. You step through seven stages one at a time
(Tokenize → Embed + position → Transformer blocks → Logits → Softmax → Sample → Append, repeat), or
auto-run the loop. Along the way you get the token-ID table, illustrative 8-dimensional embeddings,
an attention-arc sketch from the last token back over the context, the top-7 logits, a temperature
slider with Σ P and entropy readouts, a log-scale plot of the full-vocabulary distribution (head and
long tail), a greedy vs. sample toggle with a "Redraw" button, and the running log-probability of
everything generated. Four preset prompts, or type your own; words outside the toy vocabulary get a
near-uniform guess, which makes the point that the model mirrors its corpus.

**Tokenization and embeddings** (`TokensScreen`) — *Text → token IDs → one-hot vectors → learned vectors in ℝᵈ.*
Four cards. (1) A tokenizer that splits an editable sentence into word-fragment tokens using a
suffix list, to show why context windows are measured in tokens and why counting the r's in
"strawberry" is hard. (2) One-hot encoding: tap two vocabulary positions and see their dot product
is 0 or 1. (3) Embeddings: 15 hand-built 8-dimensional word vectors over feature axes
(royal, male, female, human, animal, young, vehicle, machine), projected onto their top three
principal components with a PCA implemented in `src/math.ts`, and drawn in a drag-to-rotate
orthographic 3-D vector space (`VectorSpace3D`) with depth cues and an idle spin, following the
TensorFlow Embedding Projector's conventions. Tap a word to read its full vector and its cosine
similarity to the selected word. A toggle draws the king − man + woman ≈ queen arithmetic as arrows
and names the nearest real token to the result. (4) Positional embeddings: two sentences with the
same multiset of tokens and opposite meanings.

**Attention** (`AttentionScreen`) — *softmax(QKᵀ/√dₖ)V: each token weights the earlier tokens by learned relevance.*
The Winograd sentence "The trophy didn't fit in the suitcase because it was too big", with
hand-designed 4-dimensional query and key vectors over the axes thing / object / function / verb.
Pick a query token (default "it"); the arc diagram and bars show the softmax over q·kᵢ / √dₖ for
every earlier token. A scale slider sharpens or spreads the softmax, a causal-mask chip hides
future positions, and a values card shows the output vector as a weighted blend of the attended
value vectors. A closing card describes the transformer block and multi-head attention.

**Softmax, temperature, and sampling** (`SoftmaxScreen`) — *Logits → a probability distribution → one drawn token.*
Six candidate next tokens for the prompt "The capital of France is" (Paris, the, a, Lyon, located,
NPRD), each with a logit slider. A temperature slider re-shapes the probability mass function, with
Σ P and entropy (against its ln 6 maximum) shown live. A probability-simplex card (`Simplex`) draws
the triangle of all distributions over three tokens, shaded by entropy, with the curve softmax(z/T)
traces as T varies and a dot for the current distribution. A decoding card lets you draw greedily or
by sampling and keeps a history of draws. A final card frames next-token prediction as
classification and shows the loss −log P(Paris) at the current settings.

**Entropy, cross-entropy, and alignment** (`AlignmentScreen`) — *The training loss, and the pre-training → SFT → RLHF pipeline.*
A three-stage pipeline selector (Base, SFT, RLHF) that changes the sample reply to "What is the
capital of France?" and the explanation. An RLHF card where you rank a pair of responses, nudge an
illustrative reward model, and move a β slider on the KL-penalty objective
max E[r(x,y)] − β·KL(π_θ ‖ π_SFT). A base-vs-aligned card on where capability lives and why
jailbreaks work. An entropy card comparing one die, two dice, and a point mass with computed
values, then cross-entropy as the training loss that collapses to −log q(x*).

### Neural Networks · Weighted Sum, Bias, Nonlinearity: ML Models and the Anatomy of a Neural Network

**The neuron** (`NeuronScreen`) — *a = σ(Σⱼ wⱼaⱼ + b): weighted sum, bias, nonlinearity.*
A single neuron with four inputs, drawn as an SVG diagram where edge thickness is |w|, edge color is
the sign of the weight, and fill brightness is activation. Sliders for each input activation, each
weight, and the bias; chips to pick ReLU, sigmoid, or no activation, with the function plotted and
the pre-activation z broken into its per-term contributions.

**Feature detectors** (`CrossbarScreen`) — *Why a neuron tuned to the crossbar of a 7 fires on a 5 but not a 6.*
An 8×8 pixel grid with preset digits and a neuron whose weights cover the crossbar row of a 7.
Draw mode lets you tap pixels; weight mode lets you cycle each cell's weight through 0 → +1 → −1 to
design your own detector. A bias slider sets the firing threshold, the activation
a = ReLU(Σ wⱼaⱼ + b) is computed and shown, and a worked example walks the sum by hand.

**The forward pass** (`ForwardPassScreen`) — *a⁽ᴸ⁾ = σ(W⁽ᴸ⁾a⁽ᴸ⁻¹⁾ + b⁽ᴸ⁾), layer by layer, in a multilayer perceptron.*
A 4 → 5 → 3 network (classes cat, dog, bird) with seeded random weights. Tap an input node to
cycle it through 0 → 0.5 → 1, then propagate one layer at a time with the "Compute hidden layer" and
"Compute output" buttons. Tap any hidden or output neuron to see its own equation and highlight its
incoming edges. A matrix-form card shows the layer equations, the parameter count, and the
comparison to the lecture's 784 → 512 → 512 → 10 digit network. "Random weights" re-seeds the network.

### Training · Predict, Measure, Update: How Neural Networks Learn

**Gradient descent** (`GradientScreen`) — *θ ← θ − η∇L(θ): step against the slope of the loss.*
Two views. First, a self-contained Three.js scene (`src/gd3d/sceneHtml.ts`, rendered in an iframe
on web and a WebView on native) of a loss landscape over two weights: a sphere for the current
weights, a tangent plane and gradient arrow at each step, breadcrumbs of the path, a live readout
of parameters, loss, gradient, and iteration, a loss-history chart, a learning-rate slider, and
Valley / Ravine surfaces (the ravine's zigzag motivates momentum and Adam). Drag to rotate, pinch
to zoom, tap the terrain to move the weights, double-tap to reset the camera; it reports
convergence or divergence. Second, a one-weight quartic loss curve with Step / Run / Reset, three
start positions (including one near the hump, to find a local minimum), a learning-rate slider, an
SGD-noise toggle, and a loss-vs-iteration plot.

**Loss functions and the training loop** (`TrainingScreen`) — *Predict, measure (MSE or cross-entropy), update.*
A two-weight linear model ŷ = ax + b fitted to 10 seeded points. The Predict → Measure → Update
button cycles the three phases and the plot shows the line, the residuals, and the loss. Cards for
mean squared error (with the live value), the hand-derived gradient step ∂L/∂a and ∂L/∂b with a
learning-rate slider that lets you overshoot, a loss-curve history, a PyTorch training-loop listing
whose lines highlight with the current phase, and cross-entropy with a slider for the probability
assigned to the correct class.

## Themes

A switcher in the header picks one of three palettes at runtime (`src/theme.ts`):

- **Paper** (default): white page and black serif text like the course essays, with bolded defined terms. Forest green, sage, and gold are kept for controls, plots, and the 3-D scene.
- **Trine**: cream background, white cards with soft shadows, forest green for controls, gold as decoration.
- **Dark**: the original look, where activations read as brightness.

Typography is LaTeX-like: a serif face (Georgia on iOS and web, the system serif on Android) for
body text and headings, italic serif for formulas, and monospace only for code and raw numbers.

## Running it

Install dependencies once:

```bash
npm install
```

### On your phone

1. Install **Expo Go** from the App Store (iPhone) or Play Store (Android).
2. In this folder run `npx expo start`.
3. Scan the QR code with the iPhone camera, or from inside Expo Go on Android. Phone and computer must be on the same Wi-Fi.

### In a browser

```bash
npx expo start --web --port 8090
```

Then open http://localhost:8090. Two query parameters are read on the web:

- `?theme=paper|trine|dark` picks the palette up front.
- `?open=<key>` expands only that entry, handy for sharing a link. Keys: `loop`, `tokens`, `attention`, `softmax`, `alignment`, `neuron`, `crossbar`, `forward`, `gradient`, `training`.

The 3-D gradient-descent scene loads Three.js from cdnjs the first time, so it needs an internet
connection once.

### Static web build

`npx expo export --platform web` writes a static site to `dist/` (ignored by git).

## Layout

```
App.tsx                      SafeAreaProvider around HomeScreen
index.ts                     Expo root registration
app.json                     Expo config (name "ML Concepts", portrait, light UI style)
src/
  nav.ts                     SECTIONS: the three lectures and their ten entries (key, title, definition, essay citation, component)
  theme.ts                   Paper / Trine / Dark palettes, runtime switching, fonts, spacing
  math.ts                    softmax, ReLU, sigmoid, entropy, argmax, sampling, cosine, PCA (power iteration), seeded PRNG, colour helpers
  toyLM.ts                   the 22-sentence bigram language model behind the generation loop
  screens/
    HomeScreen.tsx           header, palette switcher, abstract, accordion of all entries
    LoopScreen.tsx           autoregressive generation
    TokensScreen.tsx         tokenization, one-hot, PCA embeddings, positional embeddings
    AttentionScreen.tsx      scaled dot-product attention on the trophy/suitcase sentence
    SoftmaxScreen.tsx        logits, temperature, simplex, decoding
    AlignmentScreen.tsx      pipeline, RLHF objective, entropy and cross-entropy
    NeuronScreen.tsx         one neuron with sliders
    CrossbarScreen.tsx       8×8 feature detector
    ForwardPassScreen.tsx    4 → 5 → 3 multilayer perceptron
    GradientScreen.tsx       3-D landscape plus one-weight curve
    TrainingScreen.tsx       linear-regression training loop
  components/
    ui.tsx                   Screen, Card, P, Small, Formula, Btn, Chip, LabeledSlider, Bar, Legend; **bold** / *italic* inline markup
    Simplex.tsx              probability simplex for three outcomes
    VectorSpace3D.tsx        drag-to-rotate orthographic 3-D scatter with arrows
    HtmlView.tsx             iframe on web, react-native-webview on native
  gd3d/
    sceneHtml.ts             the Three.js gradient-descent page as one HTML string
```

## Stack

Expo SDK 57, React Native 0.86, React 19, TypeScript (strict), react-native-svg for all 2-D
plots, `@react-native-community/slider` for controls, react-native-webview and react-native-web
for the embedded 3-D scene, Three.js 0.158 inside that scene. No backend and no network calls
beyond the one Three.js fetch.
