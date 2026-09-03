# ML Concepts

Interactive mobile app illustrating the ideas from the ML/AI course notes (lectures 2–4).

## What's in the app

The app displays three lectures worth of interactive demonstrations, each with live-computed visualizations:

### Lecture 2: From Probability to Assistant
*How Language Models Work and How They Learn to Help*

- **Autoregressive generation** — Predict P(xₜ | x₁,…,xₜ₋₁), append the chosen token, repeat.
- **Tokenization and embeddings** — Text → token IDs → one-hot vectors → learned vectors in ℝᵈ.
- **Attention** — softmax(QKᵀ/√dₖ)V: each token weights the earlier tokens by learned relevance.
- **Softmax, temperature, and sampling** — Logits → a probability distribution → one drawn token.
- **Entropy, cross-entropy, and alignment** — The training loss, and the pre-training → SFT → RLHF pipeline.

### Lecture 3: Weighted Sum, Bias, Nonlinearity
*ML Models and the Anatomy of a Neural Network*

- **The neuron** — a = σ(Σⱼ wⱼaⱼ + b): weighted sum, bias, nonlinearity.
- **Feature detectors** — Why a neuron tuned to the crossbar of a 7 fires on a 5 but not a 6.
- **The forward pass** — a⁽ᴸ⁾ = σ(W⁽ᴸ⁾a⁽ᴸ⁻¹⁾ + b⁽ᴸ⁾), layer by layer, in a multilayer perceptron.

### Lecture 4: Predict, Measure, Update
*How Neural Networks Learn*

- **Gradient descent** — θ ← θ − η∇L(θ): step against the slope of the loss.
- **Loss functions and the training loop** — Predict, measure (MSE or cross-entropy), update.

Every number on screen is computed live from the stated formula; the models are small enough to finish instantly.

## Run on your phone

1. Install **Expo Go** from the App Store (iPhone) or Play Store (Android).
2. In this folder run `npx expo start`.
3. Scan the QR code with the iPhone camera (or from inside Expo Go on Android). Phone and Mac must be on the same Wi-Fi.

## Run in a browser

`npx expo start --web --port 8090` then open http://localhost:8090. Screens are addressable by URL (`/loop`, `/tokens`, `/attention`, `/softmax`, `/alignment`, `/neuron`, `/crossbar`, `/forward-pass`, `/gradient`, `/training`).

## Project layout

- `src/screens/` — One interactive component per concept (LoopScreen, TokensScreen, AttentionScreen, etc.)
- `src/components/ui.tsx` — Shared UI cards, sliders, bars, and chips
- `src/theme.ts` �� Palettes (Paper, Trine, Dark) and style helpers
- `src/nav.ts` — Navigation structure mapping concepts to screens
- `src/toyLM.ts` — The tiny bigram language model used in demonstrations
- `src/math.ts` — Softmax, ReLU, entropy, sampling, seeded PRNG

## Themes

Switch between three themes directly in the app header:

- **Paper** — Light, serif, analog feel
- **Trine** — Medium, geometric, balanced
- **Dark** — Dark mode, comfortable for low-light viewing

On web, use `?theme=paper|trine|dark` in the URL.
