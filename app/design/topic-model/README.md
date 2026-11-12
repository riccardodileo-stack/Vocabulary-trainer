# Modello delle categorie (rete neurale)

Genera `src/content/topicModel.ts`, usato da `src/domain/topicClassifier.ts` per suggerire le
categorie di una parola **sul telefono, offline** (funziona anche in Expo Go).

## Come funziona

Sul computer (una volta sola):

1. **Semi** (`seeds.py`) — ~3.200 parole scritte a mano nelle 12 categorie e 5 lingue, più ~600
   parole "generiche" senza categoria.
2. **Modello di linguaggio** (`llm.py`, `llm_label.py`) — Qwen2.5-1.5B-Instruct legge un campione di
   3.900 parole del vocabolario e sceglie la categoria (A–L) o "nessuna" (M).
3. **Insegnante** (`distill.py`) — una regressione logistica sui vettori di significato di due reti
   multilingue (paraphrase-multilingual-MiniLM e LaBSE), addestrata su semi + etichette del
   modello di linguaggio. Etichetta le 15.000 parole più frequenti di ogni lingua (75.000, liste
   [FrequencyWords](https://github.com/hermitdave/FrequencyWords)). Sulle parole del campione
   vince l'etichetta del modello di linguaggio, sui semi quella scritta a mano.
   **Soglia severa** (`relabel.py`): si tiene una categoria solo con probabilità ≥ 0.40
   (precisione 0.91 sul test, contro 0.75 con la soglia che massimizzava F1); l'etichetta del
   modello di linguaggio vince solo se è sicuro (≥ 0.8, o "nessuna" ≥ 0.6).
4. **Studente** (`train.py`) — una piccola rete (gruppi di 2–5 lettere → 8192 contenitori via hash
   → 24 neuroni ReLU → 12 uscite sigmoidi) impara a imitare l'insegnante, per le parole che non
   sono nel lessico.
5. **Esportazione** (`export.py`) — lessico **per lingua** (parola → categorie: *burro* è burro in
   italiano e asino in spagnolo), hash delle parole note senza categoria, pesi dello studente in
   int8. File ~700 KB.

Nel telefono le categorie sono **per significato** (`suggestMeaningTopics`): decide la traduzione
(*stroke* = *ictus* → Salute, = *colpo* → nessuna). La parola studiata conta solo se ha un'unica
traduzione e la rete non la conosce. Una traduzione che la rete sa essere senza categoria
(*caserma*) resta senza. Lo studente conta solo quando è sicuro (≥ 0.8). Al massimo 3 categorie per
significato. Un test controlla che TypeScript dia gli stessi risultati di Python.

## Qualità

Misurata su `testset.py`: ~200 parole difficili etichettate a mano e mai usate per
l'addestramento (fattoria/animali vs cibo, utensili, salute…). Metà per scegliere le soglie,
metà per il voto finale (F1 = media tra precisione e copertura):

| Insegnante | Precisione | Copertura | F1 |
|---|---|---|---|
| v1: vicini più simili ai semi (MiniLM) | 0.65 | 0.35 | 0.45 |
| Qwen2.5-1.5B da solo | 0.84 | 0.63 | 0.72 |
| v2: MiniLM + LaBSE addestrati su semi + Qwen | 0.75 | 0.60 | 0.67 |
| **v2 con soglia severa (in uso)** | **0.91** | **0.45** | 0.60 |

Qwen da solo è il migliore ma sul computer fa ~2 parole al secondo, quindi lo usiamo su un
campione e la v2 generalizza al resto. Nell'app la parola e la traduzione votano insieme, il che
toglie altro rumore. Esempi dopo la correzione: *germoglio*, *bestiame*, *seme*, *fienile* →
Natura; *pollame*, *gallina*, *grano* → Cibo + Natura; *padella* → Cibo + Casa.

## Rigenerare

Serve un computer con ~8 GB di RAM; il passo 3 richiede ~40 minuti su 2 core.

```bash
pip install onnxruntime tokenizers scikit-learn scipy numpy torch transformers
mkdir -p work/model work/freq work/models/LaBSE
for f in onnx/model_quantized.onnx tokenizer.json; do
  curl -L -o work/model/$(basename $f) https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/resolve/main/$f
  curl -L -o work/models/LaBSE/$(basename $f) https://huggingface.co/Xenova/LaBSE/resolve/main/$f
done
for l in en it es fr de; do
  curl -L -o work/freq/$l.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/$l/${l}_50k.txt
done
python3 teacher.py                 # soglie della v1        -> work/calib.json
python3 label_vocab.py             # elenco del vocabolario -> work/vocab.npz
python3 llm_label.py               # Qwen sul campione      -> work/llm_labels.npz (~40 min)
python3 distill.py minilm,labse --label   # insegnante v2   -> work/vocab2.npz
python3 relabel.py                 # soglia severa          -> work/vocab3.npz
python3 train.py 13 24             # studente               -> work/clf_13_24.pkl
python3 export.py ../../src/content/topicModel.ts
```

`work/` (modelli, liste di parole) non va committata. `evalsup.py` e `llm.py` da soli confrontano
gli insegnanti su `testset.py`.

**Per cambiare le categorie**: modificare `seeds.py`, `TOPIC_DESC` in `llm.py` **e**
`src/domain/topics.ts` (stesso ordine) e i nomi in `src/i18n`, poi rigenerare.

**In futuro (server)**: `suggestTopics` può chiedere al server un modello più grande; il resto
dell'app non cambia.
