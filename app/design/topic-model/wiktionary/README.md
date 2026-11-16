# Categorie dai sensi di Wiktionary

Genera `src/content/senseTopics.ts`: le categorie dei significati prese dai **sensi di Wiktionary**,
che hanno già le etichette di settore (*medicine*, *cricket*, *cooking*…) e le tabelle delle traduzioni.
È lo strato che sa che *stroke* = *ictus* è Salute e *court* = *campo* è Sport, cosa che la rete
neurale (che guarda una parola alla volta) non può sapere.

## Da dove vengono i dati

[kaikki.org](https://kaikki.org) pubblica Wiktionary inglese già estratto in JSON (strumento
*wiktextract*), licenza CC BY-SA come Wiktionary. Si usa il file delle parole inglesi
(`kaikki.org-dictionary-English.jsonl.gz`, ~530 MB): ogni senso ha i suoi `topics` e `categories`
e la tabella delle traduzioni in tutte le lingue.

## Come si genera

```sh
mkdir -p work && cd work
curl -O https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz
mv kaikki.org-dictionary-English.jsonl.gz en.jsonl.gz
cp ../*.py .
python3 extract.py   # ~1 min: groups.jsonl, una riga per tabella di traduzioni (~150.000)
python3 build.py     # words.json e pairs.json
python3 export.py ../../../../src/content/senseTopics.ts
```
`build.py` usa gli elenchi di frequenza delle 5 lingue (le 50.000 parole più usate, "parola conteggio"
per riga) in `freq/<lingua>.txt`, oppure nella cartella indicata da `FREQ_DIR`: sono gli stessi del
modello delle categorie (*FrequencyWords*, vedi `../README.md`), per esempio
`FREQ_DIR=../work/freq python3 build.py`.

## Come funziona

1. **`extract.py`** — per ogni parola inglese, ogni tabella di traduzioni con il suo senso
   (glossa, etichette, categorie) e le traduzioni in it/es/fr/de, più *in quante lingue* è tradotta
   (= quanto è comune quel senso).
2. **`trust.py`** — Wiktionary a volte attacca una tabella al senso sbagliato. Una tabella vale solo
   se la sua glossa somiglia a quella del senso, o se ha un'etichetta esplicita ("(golf) …"),
   o se la parola ha una sola tabella.
3. **`mapping.py`** — etichette e categorie di Wiktionary → le 12 categorie dell'app (es. *cardiology*,
   *Diseases* → Salute; *Ball games*, *Tennis* → Sport). I "genitori" generici (*sciences*, *lifestyle*,
   *mathematics* sopra *computing*…) vengono ignorati.
4. **`build.py`** — per ogni coppia di parole di due lingue presenti nella stessa tabella
   (anche senza inglese: *Schlaganfall* = *ictus* passa per *stroke*): una categoria resta se pesa
   almeno il **30%** delle tabelle in cui compare la coppia (peso = numero di lingue); se il **30%** o più
   di quelle tabelle non ha nessuna categoria, la coppia è "generica" (*stroke* = *colpo*: colpire,
   arma, attrezzo…) e non riceve categorie. Lo stesso parola per parola (*ictus* → Salute).
5. **`export.py`** — tiene nell'app le parole comuni (le 50.000 più usate per lingua) e, delle coppie,
   solo quelle che dicono qualcosa in più delle due parole da sole: ~37.000 parole e ~50.000 coppie,
   1,4 MB.

## Come la usa l'app

`suggestMeaningTopics` in `src/domain/topicClassifier.ts`, in ordine:
1. la **coppia** parola + traduzione è in Wiktionary → le sue categorie;
2. la rete neurale conosce la **traduzione** → le sue categorie (anche nessuna);
3. Wiktionary conosce la **traduzione** da sola → le sue categorie abituali;
4. solo se la parola ha un'unica traduzione: la parola studiata (rete, poi Wiktionary).

Il file viene "spacchettato" una lingua o una coppia di lingue alla volta, la prima volta che serve
(pochi millisecondi).

## Qualità e limiti

- Su un campione casuale di coppie inglese–italiano le categorie sono giuste circa 9 volte su 10;
  gli errori sono quasi sempre una categoria in più (*keyboard* = *tastiera* → Informatica + Cultura,
  perché è anche lo strumento musicale).
- Wiktionary etichetta soprattutto i sensi **di settore**; le parole quotidiane (*cane*, *mela*,
  *cucina*) spesso non hanno etichetta: lì resta la rete neurale.
- Le parole rare (fuori dalle 50.000 più usate) non sono nell'app per tenerla leggera: per esempio
  *bracciata*. Il server (`supabase/`) può contenere l'elenco completo (~200.000 coppie).
