from paths import WORK
import sys, re, json, numpy as np
from teacher import scores, TOPICS
from embedm import embedder
embed = embedder('minilm')
cal = json.load(open(f'{WORK}/calib.json'))
TOP = 15000
ok = re.compile(r"^[a-zàâäáãåçéèêëíìîïñóòôöõúùûüßœæ]{3,}$")
rows = []
for l in ['en', 'it', 'es', 'fr', 'de']:
    n = 0
    for line in open(f'{WORK}/freq/{l}.txt', encoding='utf-8'):
        w = line.split()[0]
        if ok.match(w):
            rows.append((w, l)); n += 1
            if n >= TOP: break
V = embed([w for w, _ in rows], batch=1024)
s, g = scores(V)
lab = (s >= cal['tau']) & ((s - g[:, None]) >= cal['delta'])
np.savez_compressed(f'{WORK}/vocab.npz', words=np.array([w for w, _ in rows]), langs=np.array([l for _, l in rows]), scores=s, generic=g, labels=lab)
print('words', len(rows), 'labelled with >=1 topic', lab.any(1).sum())
for i, t in enumerate(TOPICS):
    idx = np.where(lab[:, i])[0]
    print(t, len(idx), ' '.join(rows[j][0] for j in idx[:: max(1, len(idx) // 18)][:18]))
