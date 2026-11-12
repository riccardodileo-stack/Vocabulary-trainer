"""Embedding for several candidate teacher models (ONNX, quantized)."""
from paths import WORK
import numpy as np, onnxruntime as ort
from tokenizers import Tokenizer

CFG = {
    'minilm': (f'{WORK}/model', '', 'mean'),
    'e5s': (f'{WORK}/models/multilingual-e5-small', 'query: ', 'mean'),
    'e5b': (f'{WORK}/models/multilingual-e5-base', 'query: ', 'mean'),
    'labse': (f'{WORK}/models/LaBSE', '', 'pooler'),
}
_cache = {}

def embedder(name):
    if name in _cache:
        return _cache[name]
    path, prefix, pooling = CFG[name]
    tok = Tokenizer.from_file(f'{path}/tokenizer.json')
    pad = tok.token_to_id('<pad>') if tok.token_to_id('<pad>') is not None else tok.token_to_id('[PAD]')
    tok.enable_padding(pad_id=pad)
    tok.enable_truncation(max_length=24)
    sess = ort.InferenceSession(f'{path}/model_quantized.onnx', providers=['CPUExecutionProvider'])
    names = [i.name for i in sess.get_inputs()]
    outs = [o.name for o in sess.get_outputs()]

    def embed(texts, batch=512):
        res = []
        for i in range(0, len(texts), batch):
            enc = tok.encode_batch([prefix + t for t in texts[i:i + batch]])
            ids = np.array([e.ids for e in enc], dtype=np.int64)
            mask = np.array([e.attention_mask for e in enc], dtype=np.int64)
            feed = {'input_ids': ids, 'attention_mask': mask}
            if 'token_type_ids' in names:
                feed['token_type_ids'] = np.zeros_like(ids)
            out = sess.run(None, feed)
            if pooling == 'pooler' and 'pooler_output' in outs:
                v = out[outs.index('pooler_output')]
            else:
                h = out[0]
                v = (h * mask[..., None]).sum(1) / mask.sum(1, keepdims=True)
            res.append(v / np.linalg.norm(v, axis=1, keepdims=True))
        return np.vstack(res).astype(np.float32)
    _cache[name] = embed
    return embed
