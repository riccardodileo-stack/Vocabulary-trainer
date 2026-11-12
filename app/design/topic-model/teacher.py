"""Label a large multilingual vocabulary with topics using kNN over the seed embeddings."""
from paths import WORK
import sys, re, json, numpy as np
from seeds import SEEDS, GENERIC, TOPICS, LANGS, words
from embedm import embedder
embed = embedder('minilm')

K = 3
# --- seeds
seed_rows = []  # (word, lang, set(topics))
index = {}
for t in TOPICS:
    for l in LANGS:
        for w in words(SEEDS[t][l]):
            key = (w.lower(), l)
            if key in index:
                seed_rows[index[key]][2].add(t)
            else:
                index[key] = len(seed_rows); seed_rows.append((w, l, {t}))
generic_rows = [(w, l) for l in LANGS for w in words(GENERIC[l]) if (w.lower(), l) not in index]
S = embed([w for w, _, _ in seed_rows]); G = embed([w for w, _ in generic_rows])
topic_idx = {t: np.array([i for i, r in enumerate(seed_rows) if t in r[2]]) for t in TOPICS}

def scores(V, exclude=None):
    """Mean of the K best cosines to each topic's seeds, and to the generic words."""
    sim = V @ S.T
    if exclude is not None:
        sim[np.arange(len(V)), exclude] = -1
    out = np.stack([np.sort(sim[:, topic_idx[t]], axis=1)[:, -K:].mean(1) for t in TOPICS], 1)
    g = np.sort(V @ G.T, axis=1)[:, -K:].mean(1)
    return out, g

if __name__ == '__main__':
    # Calibration: leave-one-out on seeds (positives/negatives) + generic words (negatives)
    ss, sg = scores(S, exclude=np.arange(len(S)))
    gs, gg = scores(G)
    gs_g = gs.copy()
    Y = np.array([[t in r[2] for t in TOPICS] for r in seed_rows])
    best = None
    for tau in np.arange(0.40, 0.80, 0.01):
        for delta in np.arange(0.0, 0.25, 0.01):
            pred_s = (ss >= tau) & ((ss - sg[:, None]) >= delta)
            pred_g = (gs >= tau) & ((gs - gg[:, None]) >= delta)
            tp = (pred_s & Y).sum(); fp = (pred_s & ~Y).sum() + pred_g.sum(); fn = (~pred_s & Y).sum()
            p = tp / max(tp + fp, 1); r = tp / max(tp + fn, 1); f = 2 * p * r / max(p + r, 1e-9)
            score = f if p >= 0.85 else 0
            if best is None or score > best[0]:
                best = (score, tau, delta, p, r)
    print('calibration F1=%.3f tau=%.2f delta=%.2f P=%.3f R=%.3f' % best)
    json.dump({'tau': float(best[1]), 'delta': float(best[2])}, open(f'{WORK}/calib.json', 'w'))
