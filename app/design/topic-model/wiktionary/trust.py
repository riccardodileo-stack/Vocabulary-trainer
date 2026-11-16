import json, re, collections
STOP = set("a an the of or and to in on for with by as at from one's one oneself someone something its it is be that which who used see also especially usually".split())
def stem(w):
    for suf in ('ing', 'es', 'ed', 's'):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[: -len(suf)]
    return w
def toks(s): return {stem(w) for w in re.findall(r"[a-z]+", s.lower()) if w not in STOP and len(w) > 2}
def load():
    per_word = collections.Counter()
    rows = [json.loads(l) for l in open('groups.jsonl')]
    for d in rows: per_word[(d['w'], d['pos'])] += 1
    for d in rows:
        g = re.sub(r'\s*—.*', '', d['gloss'])
        label = re.match(r'^\(?([a-z][a-z \-]+)\)?:\s|^\(([^)]+)\)', g)
        a, b = toks(g), toks(d['sgloss'])
        sim = len(a & b) / max(1, min(len(a), len(b))) if a and b else 0
        generic = g.strip() in ('', 'Translations')
        d['label'] = (label.group(1) or label.group(2)).strip() if label else None
        d['trusted'] = (generic and per_word[(d['w'], d['pos'])] == 1) or (sim >= 0.3) or bool(d['label'])
    return rows
