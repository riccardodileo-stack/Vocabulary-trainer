"""Labels a sample of the vocabulary with the LLM teacher (checkpointed)."""
from paths import WORK
import sys, re, os, numpy as np
from testset import items
from features import fold
from llm import Teacher
rng = np.random.default_rng(1)
test = {fold(w) for w, _, _ in items()}
ok = re.compile(r"^[a-zàâäáãåçéèêëíìîïñóòôöõúùûüßœæ]{3,}$")
plan = {'en': 1500, 'it': 1500, 'es': 300, 'fr': 300, 'de': 300}
sample = []
for l, n in plan.items():
    ws = [line.split()[0] for line in open(f'{WORK}/freq/{l}.txt', encoding='utf-8')]
    ws = [w for w in ws if ok.match(w) and fold(w) not in test][300:20000]
    # more weight to ranks 300–8000 (common vocabulary), some from the long tail
    idx = np.concatenate([rng.choice(7700, int(n * 0.65), replace=False), 7700 + rng.choice(len(ws) - 7700, n - int(n * 0.65), replace=False)])
    sample += [(ws[i], l) for i in idx]
out = f'{WORK}/llm_labels.npz'
done_w, done_l, done_p = [], [], []
if os.path.exists(out):
    d = np.load(out); done_w, done_l, done_p = list(d['words']), list(d['langs']), list(d['probs'])
todo = sample[len(done_w):]
t = Teacher('Qwen/Qwen2.5-1.5B-Instruct')
for i in range(0, len(todo), 64):
    chunk = todo[i:i + 64]
    P = t.probs(chunk)
    done_w += [w for w, _ in chunk]; done_l += [l for _, l in chunk]; done_p += list(P)
    np.savez(out, words=np.array(done_w), langs=np.array(done_l), probs=np.array(done_p))
    print(len(done_w), '/', len(sample), flush=True)
