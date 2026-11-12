"""Features shared by training (Python) and the app (TypeScript, same algorithm):
hashed character n-grams (2..5) of the folded word plus the whole word, L2-normalised."""
import unicodedata, numpy as np
from scipy.sparse import csr_matrix

def fold(text):
    text = unicodedata.normalize('NFD', text.lower())
    text = ''.join(c for c in text if not 0x300 <= ord(c) <= 0x36f)
    return ' '.join(text.replace('’', "'").split())

def fnv1a(s):
    """32-bit FNV-1a over UTF-16 code units (what JS charCodeAt gives)."""
    data = s.encode('utf-16-le')
    h = 0x811c9dc5
    for i in range(0, len(data), 2):
        h ^= data[i] | (data[i + 1] << 8)
        h = (h * 0x01000193) & 0xffffffff
    return h

def feature_strings(text):
    w = fold(text)
    padded = f'<{w}>'
    feats = ['W:' + w]
    for n in range(2, 6):
        feats += [padded[i:i + n] for i in range(len(padded) - n + 1)]
    return feats

def vectorize(texts, bits):
    size = 1 << bits
    rows, cols, vals = [], [], []
    for r, t in enumerate(texts):
        counts = {}
        for f in feature_strings(t):
            b = fnv1a(f) & (size - 1)
            counts[b] = counts.get(b, 0) + 1
        norm = np.sqrt(sum(v * v for v in counts.values()))
        for b, v in counts.items():
            rows.append(r); cols.append(b); vals.append(v / norm)
    return csr_matrix((vals, (rows, cols)), shape=(len(texts), size), dtype=np.float32)
