# ML Concepts

Interactive mobile app illustrating the ideas from the ML/AI course notes (lectures 2–4):
language-model loop, tokens and embeddings, attention, softmax and temperature, alignment,
single neuron, the crossbar-of-7 check, forward pass, gradient descent, and the training loop.

## Run on your phone

1. Install **Expo Go** from the App Store (iPhone) or Play Store (Android).
2. In this folder run `npx expo start`.
3. Scan the QR code with the iPhone camera (or from inside Expo Go on Android). Phone and Mac must be on the same Wi-Fi.

## Run in a browser

`npx expo start --web --port 8090` then open http://localhost:8090. Screens are addressable by URL
(`/loop`, `/tokens`, `/attention`, `/softmax`, `/alignment`, `/neuron`, `/crossbar`, `/forward-pass`, `/gradient`, `/training`).

## Layout

- `src/screens/` one file per concept screen
- `src/components/ui.tsx` shared cards, sliders, bars, chips
- `src/toyLM.ts` the tiny bigram language model behind "The whole machine"
- `src/math.ts` softmax, ReLU, entropy, sampling, seeded PRNG
