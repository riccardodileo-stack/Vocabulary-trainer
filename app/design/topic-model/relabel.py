"""Stricter labels (precision first): teacher v2 probabilities with abs 0.40 / rel 0.5
(test: P=0.91, R=0.45); the LLM label wins only where the LLM is confident."""
import sys, numpy as np
from features import fold
from paths import WORK

ABS, REL = 0.40, 0.5
LLM_TOPIC, LLM_NONE = 0.8, 0.6

v = dict(np.load(f'{WORK}/vocab2.npz'))
probs = v['probs']
labels = (probs >= ABS) & (probs >= REL * probs.max(1, keepdims=True))
d = dict(np.load(f'{WORK}/llm_labels.npz'))
llm = {}
for w, l, p in zip(d['words'], d['langs'], d['probs']):
    topics = p[:12] >= LLM_TOPIC
    if topics.any():
        llm[(str(l), fold(str(w)))] = topics
    elif p[12] >= LLM_NONE:
        llm[(str(l), fold(str(w)))] = np.zeros(12, bool)
words, langs = [str(w) for w in v['words']], [str(l) for l in v['langs']]
changed = 0
for i, (w, l) in enumerate(zip(words, langs)):
    row = llm.get((l, fold(w)))
    if row is not None:
        labels[i] = row; changed += 1
np.savez_compressed(f'{WORK}/vocab3.npz', words=v['words'], langs=v['langs'], labels=labels, probs=probs)
print('with topic', labels.any(1).sum(), 'of', len(words), '| from LLM', changed)
