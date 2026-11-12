"""Supervised teacher: logistic regression on embeddings, trained on seeds + generic words."""
import sys, numpy as np
from seeds import SEEDS, GENERIC, TOPICS, LANGS, words
from testset import items
from embedm import embedder
from features import fold
from sklearn.linear_model import LogisticRegression

test = items(); test_words = {fold(w) for w, _, _ in test}
dev, tst = test[0::2], test[1::2]
def training():
    lab = {}
    for t in TOPICS:
        for l in LANGS:
            for w in words(SEEDS[t][l]):
                if fold(w) not in test_words: lab.setdefault(w, set()).add(t)
    for l in LANGS:
        for w in words(GENERIC[l]):
            if fold(w) not in test_words: lab.setdefault(w, set())
    return list(lab), np.array([[t in s for t in TOPICS] for s in lab.values()])

def prf(P, items_):
    Y = np.array([[t in ts for t in TOPICS] for _, _, ts in items_])
    tp = (P & Y).sum(); fp = (P & ~Y).sum(); fn = (~P & Y).sum()
    p = tp / max(tp + fp, 1); r = tp / max(tp + fn, 1); return p, r, 2*p*r/max(p+r,1e-9)

X_words, Y = training()
for model in sys.argv[1].split(','):
    emb = embedder(model)
    X = emb(X_words); Xd = emb([w for w,_,_ in dev]); Xt = emb([w for w,_,_ in tst])
    for C in (1, 4, 16):
        clfs = [LogisticRegression(C=C, max_iter=2000, class_weight='balanced').fit(X, Y[:, i]) for i in range(len(TOPICS))]
        pd_ = np.stack([c.predict_proba(Xd)[:, 1] for c in clfs], 1); pt = np.stack([c.predict_proba(Xt)[:, 1] for c in clfs], 1)
        best = max(((prf(pd_ >= th, dev)[2], th) for th in np.linspace(0.3, 0.95, 27)))
        th = best[1]; p, r, f = prf(pt >= th, tst)
        print(f'{model} C={C} th={th:.2f}: TEST P={p:.2f} R={r:.2f} F1={f:.2f}')
