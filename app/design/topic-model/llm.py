"""LLM teacher: one forward pass per word, probability of each answer letter A–M."""
from paths import WORK
import sys, time, torch, numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM
torch.set_num_threads(2)

TOPIC_DESC = ['computers, internet and technology', 'medicine, health and the body', 'food, drinks and cooking',
              'travel, tourism and transport', 'work, business, money and economy', 'the house, furniture and household objects',
              'nature, plants, animals, farming and weather', 'people, family and relationships', 'school, education and science',
              'sport, games and leisure', 'art, music, literature and culture', 'feelings, emotions and personality']
LETTERS = 'ABCDEFGHIJKLM'
SHORT = ['computers', 'health/body', 'food/cooking', 'travel/transport', 'work/money', 'house/objects', 'nature/animals/farming', 'people/family', 'school/science', 'sport/leisure', 'art/culture', 'feelings/character']
LANG = {'en': 'English', 'it': 'Italian', 'es': 'Spanish', 'fr': 'French', 'de': 'German'}

class Teacher:
    def __init__(self, name):
        self.tok = AutoTokenizer.from_pretrained(name, padding_side='left')
        self.model = AutoModelForCausalLM.from_pretrained(name, torch_dtype=torch.bfloat16).eval()
        self.ids = [self.tok.encode(l, add_special_tokens=False)[0] for l in LETTERS]

    def prompt(self, word, lang):
        options = '\n'.join(f'{LETTERS[i]}) {d}' for i, d in enumerate(TOPIC_DESC)) + '\nM) none of these: an everyday word with no particular topic'
        msg = (f'Which topic does the {LANG[lang]} word "{word}" belong to?\n{options}\n'
               'Answer with one letter only.')
        return self.tok.apply_chat_template([{'role': 'user', 'content': msg}], tokenize=False, add_generation_prompt=True)

    @torch.no_grad()
    def probs(self, items, batch=16):
        out = []
        for i in range(0, len(items), batch):
            enc = self.tok([self.prompt(w, l) for w, l in items[i:i + batch]], return_tensors='pt', padding=True)
            logits = self.model(**enc).logits[:, -1, :].float()
            out.append(torch.softmax(logits[:, self.ids], -1).numpy())
        return np.vstack(out)

if __name__ == '__main__':
    from testset import items
    from seeds import TOPICS
    t = Teacher(sys.argv[1])
    test = items()
    t0 = time.time(); P = t.probs([(w, l) for w, l, _ in test]); dt = time.time() - t0
    print(f'{len(test)} words in {dt:.0f}s ({len(test)/dt:.1f}/s)')
    np.save(f'{WORK}/llm_test_{sys.argv[1].split("/")[-1]}.npy', P)
    Y = np.array([[tp in ts for tp in TOPICS] for _, _, ts in test])
    dev, tst = slice(0, None, 2), slice(1, None, 2)
    def prf(pred, y):
        tp=(pred&y).sum(); fp=(pred&~y).sum(); fn=(~pred&y).sum(); p=tp/max(tp+fp,1); r=tp/max(tp+fn,1); return p,r,2*p*r/max(p+r,1e-9)
    best=None
    for a in np.linspace(0.05,0.6,23):
        for b in (0.2,0.35,0.5,0.7,1.0):
            pr=P[:, :12]; pred=(pr>=a)&(pr>=b*pr.max(1,keepdims=True))
            f=prf(pred[dev],Y[dev])[2]
            if best is None or f>best[0]: best=(f,a,b)
    _,a,b=best; pr=P[:, :12]; pred=(pr>=a)&(pr>=b*pr.max(1,keepdims=True))
    print('abs=%.2f rel=%.2f TEST P=%.2f R=%.2f F1=%.2f' % ((a,b)+prf(pred[tst],Y[tst])))
    for (w,l,ts),row in list(zip(test,pred))[:40]:
        print(w, sorted(ts), [TOPICS[i] for i in np.where(row)[0]], end=' | ')
