from paths import WORK
import sys, json, time, numpy as np
from seeds import SEEDS, GENERIC, TOPICS, LANGS, words
from features import vectorize, fold
from sklearn.neural_network import MLPClassifier

BITS = int(sys.argv[1]) if len(sys.argv) > 1 else 14
HIDDEN = int(sys.argv[2]) if len(sys.argv) > 2 else 32
STRICT = 0.03  # teacher labels used for training need a bit more confidence
rng = np.random.default_rng(0)
cal = json.load(open(f'{WORK}/calib.json'))

# Seeds (gold), with a held-out 15% for evaluation
gold = {}
for t in TOPICS:
    for l in LANGS:
        for w in words(SEEDS[t][l]):
            gold.setdefault(fold(w), set()).add(t)
for l in LANGS:
    for w in words(GENERIC[l]):
        gold.setdefault(fold(w), set())
gold_words = sorted(gold)
rng.shuffle(gold_words)
n_test = int(len(gold_words) * 0.15)
test_gold, train_gold = gold_words[:n_test], gold_words[n_test:]

# Teacher-labelled vocabulary (skip words that are seeds)
v = np.load(f'{WORK}/vocab3.npz')
lab = v['labels']
vocab = {}
for w, row in zip(v['words'], lab):
    w = fold(str(w))
    if w not in gold:
        vocab[w] = vocab.get(w, np.zeros(len(TOPICS), bool)) | row
vw = list(vocab); rng.shuffle(vw)
n_vt = 3000
test_vocab, train_vocab = vw[:n_vt], vw[n_vt:]

def Y(ws, src):
    if src is gold:
        return np.array([[t in gold[w] for t in TOPICS] for w in ws])
    return np.array([vocab[w] for w in ws])

GOLD_REPEAT = 6
Xtr_words = train_vocab + train_gold * GOLD_REPEAT
Ytr = np.vstack([Y(train_vocab, vocab)] + [Y(train_gold, gold)] * GOLD_REPEAT)
t0 = time.time()
Xtr = vectorize(Xtr_words, BITS)
clf = MLPClassifier(hidden_layer_sizes=(HIDDEN,), activation='relu', alpha=1e-4, batch_size=256,
                    learning_rate_init=2e-3, max_iter=40, early_stopping=True, n_iter_no_change=4, random_state=0)
clf.fit(Xtr, Ytr)
print(f'bits={BITS} hidden={HIDDEN} params={clf.coefs_[0].size + clf.coefs_[1].size} train {time.time()-t0:.0f}s iters={clf.n_iter_}')

def evaluate(name, ws, y, thr):
    p = clf.predict_proba(vectorize(ws, BITS)) >= thr
    tp = (p & y).sum(); fp = (p & ~y).sum(); fn = (~p & y).sum()
    P = tp / max(tp + fp, 1); R = tp / max(tp + fn, 1)
    print(f'  {name} thr={thr}: P={P:.2f} R={R:.2f} F1={2*P*R/max(P+R,1e-9):.2f}')

for thr in (0.6, 0.7, 0.8):
    evaluate('held-out seeds ', test_gold, Y(test_gold, gold), thr)
    evaluate('held-out vocab ', test_vocab, Y(test_vocab, vocab), thr)
import pickle; pickle.dump(clf, open(f'{WORK}/clf_{BITS}_{HIDDEN}.pkl', 'wb'))
