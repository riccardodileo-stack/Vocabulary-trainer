# Streams the English Wiktionary extract and keeps, for every translation table of an
# English word, the matching sense's topics/categories and the translations in it/es/fr/de.
import gzip, json, sys
LANGS = {'it', 'es', 'fr', 'de'}
out = open('groups.jsonl', 'w')
n = kept = 0
with gzip.open('en.jsonl.gz', 'rt', encoding='utf-8') as f:
    for line in f:
        n += 1
        d = json.loads(line)
        if d.get('lang_code') != 'en':
            continue
        senses = d.get('senses') or []
        trs = list(d.get('translations') or [])
        for i, sense in enumerate(senses):
            for t in sense.get('translations') or []:
                t = dict(t); t['_sense_index'] = i
                trs.append(t)
        if not trs:
            continue
        groups = {}
        for t in trs:
            g = groups.setdefault((t.get('_sense_index'), t.get('sense') or ''), {'langs': set(), 'words': {}, 'dis': t.get('_dis1'), 'si': t.get('_sense_index')})
            lc = t.get('lang_code') or t.get('code')
            if lc:
                g['langs'].add(lc)
            if lc in LANGS and t.get('word'):
                g['words'].setdefault(lc, [])
                if t['word'] not in g['words'][lc]:
                    g['words'][lc].append(t['word'])
        for (_, gloss), g in groups.items():
            if not g['words']:
                continue
            idx = g['si']
            if idx is None and g['dis']:
                scores = [int(x) for x in g['dis'].split()]
                if scores and max(scores) > 0:
                    idx = scores.index(max(scores))
            s = senses[idx] if idx is not None and idx < len(senses) else {}
            cats = [c if isinstance(c, str) else c.get('name') for c in s.get('categories', [])]
            out.write(json.dumps({
                'w': d['word'], 'pos': d.get('pos'), 'gloss': gloss, 'pop': len(g['langs']),
                'topics': s.get('topics', []), 'cats': cats, 'raw': s.get('raw_tags', []),
                'sgloss': (s.get('glosses') or [''])[0][:160], 'tr': g['words'],
            }, ensure_ascii=False) + '\n')
            kept += 1
print(n, kept, file=sys.stderr)
