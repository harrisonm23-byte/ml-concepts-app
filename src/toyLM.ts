// A tiny bigram language model built from a hand-written corpus.
// It is real enough to demonstrate the loop honestly: logits are log-counts,
// softmax turns them into a distribution, and we sample from it.

const CORPUS = [
  'the cat sat on the mat',
  'the dog sat on the rug',
  'the cat chased the dog',
  'the dog chased the cat',
  'the cat likes the warm mat',
  'the dog likes the big rug',
  'the cat is on the mat',
  'the dog is on the rug',
  'the model predicts the next token',
  'the model samples a token from the distribution',
  'the model is trained on the internet',
  'the model is a probability engine',
  'a language model predicts the next token',
  'the next token is chosen by sampling',
  'every token is predicted from the tokens before it',
  'the trophy did not fit in the suitcase because it was too big',
  'attention decides which earlier tokens matter',
  'the weights are learned from data',
  'the loss goes down during training',
  'training adjusts the weights to lower the loss',
  'the prompt is the only steering wheel',
  'the model mirrors its training data',
];

const counts: Record<string, Record<string, number>> = {};
const unigram: Record<string, number> = {};

function add(prev: string, next: string) {
  counts[prev] = counts[prev] ?? {};
  counts[prev][next] = (counts[prev][next] ?? 0) + 1;
  unigram[next] = (unigram[next] ?? 0) + 1;
}

{
  let prev = '.';
  for (const s of CORPUS) {
    for (const t of s.split(' ')) {
      add(prev, t);
      prev = t;
    }
    add(prev, '.');
    prev = '.';
  }
}

export const VOCAB: string[] = Object.keys(unigram).sort();
export const V = VOCAB.length;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s.]/g, ' ')
    .replace(/\./g, ' . ')
    .split(/\s+/)
    .filter(Boolean);
}

export const tokenId = (t: string) => VOCAB.indexOf(t);

// Raw scores over the vocabulary for the token after `prev`.
// Unseen pairs get a small floor so the distribution never has exact zeros.
export function nextLogits(prev: string): number[] {
  const row = counts[prev];
  if (!row) return VOCAB.map((w) => Math.log((unigram[w] ?? 0) * 0.3 + 0.01));
  return VOCAB.map((w) => Math.log((row[w] ?? 0) + 0.01));
}

export const CORPUS_SIZE = CORPUS.length;
