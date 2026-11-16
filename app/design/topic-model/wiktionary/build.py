# Pairs (word, translation) -> topics, for every pair of the 5 languages, from the trusted
# translation tables. A topic is kept for a pair when the tables containing it carry the
# topic for >= SHARE of their weight (number of languages they are translated into).
import json, os, re, collections, unicodedata, sys
from trust import load
from mapping import topics_of

SHARE = 0.3
NONE_SHARE = 0.3
LANGS = ['en', 'it', 'es', 'fr', 'de']
ORDER = ['tech', 'health', 'food', 'travel', 'work', 'home', 'nature', 'people', 'school', 'sport', 'culture', 'feelings']
# Same as LEADING_WORDS in app/src/domain/text.ts
LEADING = {'en': ['the', 'a', 'an', 'to'], 'it': ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', "l'", "un'"],
           'es': ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'], 'fr': ['le', 'la', 'les', 'un', 'une', 'des', "l'", 'se', "s'"],
           'de': ['der', 'die', 'das', 'ein', 'eine', 'einen']}

def fold(text, lang):
    """Same as the app: foldForModel(stripLeadingWord(text.trim().toLowerCase(), lang))."""
    t = text.strip().lower()
    for word in LEADING[lang]:
        prefix = word if word.endswith("'") else word + ' '
        if t.startswith(prefix) and len(t) > len(prefix):
            t = t[len(prefix):].strip()
            break
    t = unicodedata.normalize('NFD', t)
    t = ''.join(ch for ch in t if not unicodedata.combining(ch)).replace('’', "'")
    return ' '.join(t.split())

# Frequency lists: 50,000 most common words per language, "word count" per line (wordfreq)
FREQ_DIR = os.environ.get('FREQ_DIR', 'freq')
freq = {l: set() for l in LANGS}
for l in LANGS:
    for i, line in enumerate(open(os.path.join(FREQ_DIR, f'{l}.txt'))):
        freq[l].add(fold(line.split()[0], l))

def ok(word, lang):
    # ",;:=" separate the entries in the exported file
    return 2 <= len(word) <= 40 and len(word.split()) <= 3 and not any(c in word for c in '[](){};|,:=/')

def common(word, lang):
    return all(w in freq[lang] for w in word.split())

rows = load()
# pair key -> topic -> weight, and total weight
weights = collections.defaultdict(lambda: collections.Counter())
totals = collections.Counter()
max_tagged = collections.Counter()  # weight of the tables that have at least one topic
for r in rows:
    if r['pop'] < 3:
        continue
    # A table whose sense is uncertain still counts as "another meaning" with no known topic
    topics = topics_of(r['topics'], r['cats']) if r['trusted'] else set()
    if r['label']:
        topics |= topics_of([r['label']], [])
    words = {'en': [r['w']]} | r['tr']
    folded = {l: {fold(w, l) for w in ws if ok(fold(w, l), l)} for l, ws in words.items() if l in LANGS}
    for a in LANGS:
        for b in LANGS:
            if a >= b:
                continue
            for x in folded.get(a, ()):
                for y in folded.get(b, ()):
                    if not (common(x, a) or common(y, b)):
                        continue
                    key = (a, b, x, y)
                    totals[key] += r['pop']
                    if topics:
                        max_tagged[key] += r['pop']
                    for t in topics:
                        weights[key][t] += r['pop']

def decide(weights_of, tagged, total):
    if (total - tagged) / total >= NONE_SHARE:
        return []
    kept = [t for t in ORDER if weights_of[t] / total >= SHARE]
    kept.sort(key=lambda t: -weights_of[t])
    return kept[:3]

# Word level: every table a word appears in (as any language), whatever the other word
wweights = collections.defaultdict(collections.Counter)
wtotals = collections.Counter()
wtagged = collections.Counter()
for r in rows:
    if r['pop'] < 3:
        continue
    topics = topics_of(r['topics'], r['cats']) if r['trusted'] else set()
    if r['label']:
        topics |= topics_of([r['label']], [])
    words = {'en': [r['w']]} | r['tr']
    for l, ws in words.items():
        if l not in LANGS:
            continue
        for w in {fold(w, l) for w in ws if ok(fold(w, l), l)}:
            if not common(w, l):
                continue
            k = (l, w)
            wtotals[k] += r['pop']
            if topics:
                wtagged[k] += r['pop']
            for t in topics:
                wweights[k][t] += r['pop']
wordtopics = {}
for k, total in wtotals.items():
    kept = decide(wweights[k], wtagged[k], total)
    if kept:
        wordtopics[k] = kept
print('word entries', len(wordtopics), file=sys.stderr)
json.dump([[l, w, t] for (l, w), t in sorted(wordtopics.items())], open('words.json', 'w'), ensure_ascii=False)

out = {}
for key, total in totals.items():
    # Many tables without a topic (stroke = colpo: hit, weapon, tool…): a generic translation
    untagged = total - max_tagged[key]
    if untagged / total >= NONE_SHARE:
        continue
    kept = [t for t in ORDER if weights[key][t] / total >= SHARE]
    if kept:
        kept.sort(key=lambda t: -weights[key][t])
        out[key] = kept[:3]
print('pairs', len(totals), 'with topics', len(out), file=sys.stderr)
by = collections.Counter((a, b) for a, b, _, _ in out)
print(by, file=sys.stderr)
json.dump([[a, b, x, y, t] for (a, b, x, y), t in sorted(out.items())], open('pairs.json', 'w'), ensure_ascii=False)
