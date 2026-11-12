"""Teacher v2: a classifier on multilingual embeddings, trained on the LLM labels
(Qwen2.5-1.5B on a vocabulary sample) + the hand-written seeds. Evaluated on testset.py,
then used to label the whole vocabulary (work/vocab2.npz)."""
from paths import WORK
import sys, re, json, numpy as np
from seeds import SEEDS, GENERIC, TOPICS, LANGS, words
from testset import items
from features import fold
from embedm import embedder
from sklearn.linear_model import LogisticRegression

MODELS = sys.argv[1].split(',') if len(sys.argv) > 1 else ['minilm', 'labse']
LLM_ABS, LLM_REL = 0.60, 0.20
test = items(); test_words = {fold(w) for w, _, _ in test}
dev, tst = test[0::2], test[1::2]

def emb(ws):
    return np.hstack([embedder(m)(ws) for m in MODELS])

# Training set: seeds, generic words, LLM-labelled sample (all without test words)
train = {}
for t in TOPICS:
    for l in LANGS:
        for w in words(SEEDS[t][l]):
            if fold(w) not in test_words: train.setdefault(w, set()).add(t)
for l in LANGS:
    for w in words(GENERIC[l]):
        if fold(w) not in test_words: train.setdefault(w, set())
d = np.load(f'{WORK}/llm_labels.npz')
P = d['probs'][:, :12]
llm = (P >= LLM_ABS) & (P >= LLM_REL * P.max(1, keepdims=True))
n_llm = 0
for w, row in zip(d['words'], llm):
    w = str(w)
    if fold(w) not in test_words and w not in train:
        train[w] = {TOPICS[i] for i in np.where(row)[0]}; n_llm += 1
X_words = list(train); Y = np.array([[t in train[w] for t in TOPICS] for w in X_words])
print('training words', len(X_words), 'from LLM', n_llm)

X = emb(X_words); Xd = emb([w for w, _, _ in dev]); Xt = emb([w for w, _, _ in tst])
Yd = np.array([[t in ts for t in TOPICS] for _, _, ts in dev]); Yt = np.array([[t in ts for t in TOPICS] for _, _, ts in tst])
def prf(pred, y):
    tp = (pred & y).sum(); fp = (pred & ~y).sum(); fn = (~pred & y).sum()
    p = tp / max(tp + fp, 1); r = tp / max(tp + fn, 1); return p, r, 2 * p * r / max(p + r, 1e-9)
def decide(pr, a, b):
    return (pr >= a) & (pr >= b * pr.max(1, keepdims=True))

best = None
for C in (0.5, 1, 2, 4):
    clfs = [LogisticRegression(C=C, max_iter=3000).fit(X, Y[:, i]) for i in range(len(TOPICS))]
    pd_ = np.stack([c.predict_proba(Xd)[:, 1] for c in clfs], 1)
    for a in np.linspace(0.15, 0.8, 27):
        for b in (0.3, 0.5, 0.7, 1.0):
            f = prf(decide(pd_, a, b), Yd)
            score = f[2] if f[0] >= 0.75 else f[2] * 0.5
            if best is None or score > best[0]:
                best = (score, C, a, b, clfs)
_, C, a, b, clfs = best
pt = np.stack([c.predict_proba(Xt)[:, 1] for c in clfs], 1)
print('C=%s abs=%.2f rel=%.2f  TEST P=%.2f R=%.2f F1=%.2f' % ((C, a, b) + prf(decide(pt, a, b), Yt)))

if '--label' in sys.argv:
    # Final model: trained on everything (test words included), then the vocabulary
    for w, _, ts in test:
        train[w] = ts
    X_words = list(train); Y = np.array([[t in train[w] for t in TOPICS] for w in X_words]); X = emb(X_words)
    clfs = [LogisticRegression(C=C, max_iter=3000).fit(X, Y[:, i]) for i in range(len(TOPICS))]
    v = np.load(f'{WORK}/vocab.npz')
    vw = [str(w) for w in v['words']]
    probs = np.vstack([np.stack([c.predict_proba(emb(vw[i:i + 4096]))[:, 1] for c in clfs], 1) for i in range(0, len(vw), 4096)])
    labels = decide(probs, a, b)
    # LLM labels win on the words it saw; the gold words (seeds, test) win on everything
    llm_map = {fold(str(w)): row for w, row in zip(d['words'], llm)}
    for i, w in enumerate(vw):
        f = fold(w)
        if f in llm_map: labels[i] = llm_map[f]
    np.savez_compressed(f'{WORK}/vocab2.npz', words=v['words'], langs=v['langs'], labels=labels, probs=probs)
    json.dump({'abs': float(a), 'rel': float(b), 'C': C, 'models': MODELS}, open(f'{WORK}/teacher2.json', 'w'))
    print('labelled', len(vw), 'with topic', labels.any(1).sum())
