# Vocabulary Trainer — app nativa (iOS + Android)

App per costruire il proprio vocabolario in una lingua straniera e ricordarlo nel tempo.
React Native con **Expo** (SDK 58) e **TypeScript**: lo stesso codice genera l'app per iPhone e Android.
Tutto funziona **offline** e i dati restano sul telefono.

Il README ha due parti:
1. **[In breve](#parte-1--in-breve)** — cosa fa l'app, le scelte di design e come fare le cose più comuni.
2. **[Come funziona davvero](#parte-2--come-funziona-davvero)** — ogni funzione spiegata nel dettaglio, con le regole esatte e i file coinvolti.

---

# Parte 1 — In breve

## Cosa fa

| Schermata | A cosa serve |
|-----------|--------------|
| **Home** | Il "cosa faccio oggi": in alto il selettore delle lingue (🇬🇧 Inglese → 🇮🇹, apre le Impostazioni), serie di giorni 🔥, numero di parole e parole imparate, **Ripasso di oggi**, **+ Aggiungi parola**, **Parole del giorno**, errori da correggere. |
| **Parole** | Il vocabolario della coppia di lingue attiva: ricerca, ordinamento (A–Z, recenti, errori), barra di "quanto la so" per ogni parola. Tocca una parola per vedere i progressi e modificarla. |
| **Allenati** | Quiz a risposta scritta: direzione (🇬🇧→🇮🇹 o al contrario), quali parole (*da ripassare*, *tutte*, *errori*), quante domande. |
| **Sfide** | In arrivo (rimandata di proposito). |
| **Impostazioni** (dal selettore delle lingue in Home o in Parole) | Tema, lingua studiata, lingua madre, livello delle parole del giorno, lingua dell'app, backup. |

## Le scelte di design, in una riga ciascuna

- **Una sola azione principale al giorno**: in Home il bottone pieno è sempre *Inizia il ripasso*. Tutto il resto è secondario. Chi apre l'app per 2 minuti sa subito cosa fare.
- **Ripasso spaziato (sistema Leitner)** invece di quiz casuali: l'app chiede le parole quando stai per dimenticarle, non tutte ogni volta.
- **Parole del giorno = parole nuove**, 5 al giorno, scelte da una lista integrata. Il codice è già pronto per prenderle da un server: si cambia **una riga**.
- **Correzione indulgente ma onesta**: articoli ("la batteria", "to run") e accenti mancanti non sono errori; una lettera sbagliata in una parola lunga vale "Quasi!" e mostra come si scrive.
- **Local-first**: nessun account, nessun server, dati in AsyncStorage. Backup in un file JSON.
- **Accessibile**: tutti i testi hanno contrasto WCAG AA (4.5:1), ogni elemento toccabile è almeno 44 pt, i bottoni-icona hanno un'etichetta per lo screen reader.
- **Due lingue dell'interfaccia** (it, en), **cinque lingue di studio** (en, it, es, fr, de), tema chiaro/scuro.

## Avviare l'app sul telefono

> 📱 Guida dettagliata passo passo per iPhone (Windows, firewall, reti universitarie, problemi comuni): **[SETUP-IPHONE.md](SETUP-IPHONE.md)**.

1. Installa **Expo Go** sul telefono (App Store / Play Store).
2. Nella cartella `app/`:
   ```sh
   npm install      # la prima volta e ogni volta che cambia package.json
   npx expo start
   ```
3. Inquadra il QR code con la fotocamera (iPhone) o con Expo Go (Android).
   Ogni file salvato aggiorna l'app sul telefono in pochi secondi.

Se il telefono non si collega (reti universitarie, firewall di Windows): `npx expo start --tunnel`.

## Prima di fare commit

```sh
npm run typecheck   # controllo dei tipi (tsc)
npm run lint        # stile del codice
npm test            # test della logica (jest)
```

> ⚠️ Dopo aver scaricato queste modifiche serve **`npm install`**: sono stati aggiunti `jest`, `jest-expo` e `@jest/globals` (solo per i test). Senza, `npm test` e il controllo dei tipi dei file di test falliscono.

## "Voglio…" → dove mettere le mani

| Voglio…                                                   | File                                                             |
|-----------------------------------------------------------|------------------------------------------------------------------|
| cambiare un colore (chiaro o scuro)                       | `src/theme/colors.ts` (controlla il contrasto, vedi Parte 2)     |
| cambiare spaziature, raggi, dimensioni di testo e icone   | `src/theme/tokens.ts`                                            |
| cambiare o aggiungere un testo                            | `src/i18n/en.ts` **e** `src/i18n/it.ts`                          |
| aggiungere parole del giorno                              | righe in fondo a `src/content/wordBank.ts`                       |
| prendere le parole del giorno da un server                | `dailyWordsSource` in `src/services/dailyWords.ts`               |
| cambiare quante parole del giorno al giorno               | `DAILY_WORDS_COUNT` in `src/domain/dailyWords.ts`                |
| cambiare gli intervalli del ripasso                       | `REVIEW_INTERVAL_DAYS` in `src/domain/review.ts`                 |
| cambiare quando una risposta è giusta / "quasi"           | `evaluateAnswer` in `src/domain/text.ts`                         |
| cambiare quando una parola esce dagli "errori"            | `MISTAKE_CLEAR_STREAK` in `src/domain/quiz.ts`                   |
| cambiare le opzioni "numero di domande"                   | `QUIZ_COUNTS` in `src/domain/quiz.ts`                            |
| aggiungere una lingua dell'interfaccia                    | nuovo `src/i18n/xx.ts` + `TRANSLATIONS` in `src/i18n/index.ts`   |
| aggiungere una lingua da studiare                         | `src/domain/languages.ts` + una colonna in `wordBank.ts` + nomi in `en.ts`/`it.ts` |
| aggiungere un campo alla parola                           | `src/domain/word.ts` + `version`/`migrate` in `src/store/wordStore.ts` |
| aggiungere una preferenza                                 | `src/store/settingsStore.ts` + `src/app/settings.tsx`            |
| cambiare le tab o le loro icone                           | `src/app/(tabs)/_layout.tsx`                                     |
| aggiungere una pagina                                     | nuovo file in `src/app/`                                         |
| aggiungere un componente grafico                          | `src/components/` (usa token e `useTheme()`, vedi Parte 2)       |

## ⚠️ Regole

1. **I dati si modificano solo con le azioni degli store**, mai modificando gli oggetti direttamente.
2. **Se cambi la forma dei dati salvati**, aumenta `version` nello store e aggiungi un passo a `migrate`, altrimenti chi ha già l'app perde i dati.
3. **Ogni testo visibile passa da `useT()`**, mai scritto nel componente.
4. **Ogni colore passa da `useTheme()`**, ogni numero di layout da `theme/tokens.ts`.
5. In `src/app/` vanno **solo schermate**. La logica pura sta in `src/domain/` (niente React) ed è coperta dai test.
6. Ogni nuovo store salvato va aggiunto a `PERSISTED_STORES` in `src/store/useStoresHydrated.ts`.

---

# Parte 2 — Come funziona davvero

## 1. Architettura

```
                ┌────────────────────────── src/app/ (schermate, Expo Router) ──────────────────────────┐
                │  Home · Parole · Allenati · Quiz · Dettaglio parola · Impostazioni                     │
                └──────────────┬───────────────────────────────┬────────────────────────────────────────┘
                     legge/azioni                         usa componenti
                               ▼                               ▼
   src/hooks/ ──► src/store/ (zustand + persist)      src/components/ (design system) ◄── src/theme/
   useDailyWords   wordStore · settingsStore                                                 colori, token
                   activityStore · dailyStore
                               │ chiama funzioni pure
                               ▼
                   src/domain/  (zero React, zero salvataggio, testato)
                   word · quiz · review · text · dates · dailyWords · activity · backup
                               ▲
   src/services/ ──────────────┘   (mondo esterno: file, Tatoeba, sorgente parole del giorno)
   src/content/wordBank.ts          (dati: lista integrata delle parole del giorno)
```

Perché così:
- **`domain/` è puro**: date e numeri entrano come parametri (es. `today`), quindi le regole si testano senza telefono e senza orologio. È la parte che cambia più spesso, ed è quella coperta dai test.
- **`services/` isola il mondo esterno**: se domani le parole del giorno arrivano da un server, o i backup vanno su cloud, cambia solo quel file.
- **Gli store sono sottili**: tengono i dati e chiamano il dominio (es. `recordAnswer` usa `statsAfterAnswer`).

### Dati salvati sul telefono

| Chiave AsyncStorage | Store | Contenuto | Versione |
|---|---|---|---|
| `words` | `wordStore` | tutte le parole di tutte le coppie | 2 |
| `settings` | `settingsStore` | tema, lingue, livello parole del giorno | 1 |
| `activity` | `activityStore` | giorni in cui ti sei allenato (max 400) | 1 |
| `daily` | `dailyStore` | parole del giorno di oggi per coppia + parole segnate "la so già" | 1 |

All'avvio la splash screen resta visibile finché tutti gli store non sono caricati (`useStoresHydrated`).

### Il modello `Word`

```ts
{
  id, sourceLang: 'en', targetLang: 'it',
  term: 'battery',                                   // parola nella lingua studiata
  meanings: [{ text: 'batteria', note?: 'elettrica', examples: [] }, { text: 'pila', examples: [] }],
  stats: { correct, wrong, streak, lastWrongAt?, lastAnsweredAt? },
  level?: 'B1', tags: [], createdAt
}
```
Ogni coppia di lingue (es. 🇬🇧→🇮🇹) è un vocabolario separato. La coppia attiva = *lingua studiata → lingua madre* (Impostazioni).

**Migrazione v1 → v2** (`wordStore.migrate`): la v2 aggiunge `stats.lastAnsweredAt`. Per le parole esistenti si usa `lastWrongAt` se c'è; le parole mai sbagliate diventano "nuove" e quindi entrano subito nel ripasso.

## 2. Ripasso spaziato (Leitner)

File: `src/domain/review.ts`.

Ogni parola sta in una **"scatola"** che è semplicemente il suo `streak` (risposte giuste di fila), con un massimo di 5:

| Scatola (streak) | 0 | 1 | 2 | 3 | 4 | 5+ |
|---|---|---|---|---|---|---|
| Dopo quanti giorni la richiede | 0 (subito) | 1 | 2 | 4 | 8 | 16 |

- Risposta **giusta** (o "quasi") → `streak + 1` → la parola sale di scatola e torna più tardi.
- Risposta **sbagliata** → `streak = 0` → torna nel ripasso di oggi.
- Parola **mai chiesta** → è "da ripassare" subito.
- **Imparata** 🏆 = scatola 5 (5 giuste di fila). È il numero "imparate" in Home e la barra piena nella lista.
- I conti sono in **giorni di calendario**, non in ore (`domain/dates.ts`): una parola ripassata alle 23:50 con intervallo 1 torna disponibile alle 00:00, e i cambi di ora legale non spostano nulla.

**Quiz "Da ripassare"**: prende le parole scadute; se sono più del numero di domande sceglie le **più in ritardo**, poi le mescola. Il ripasso dalla Home chiede al massimo 20 parole.

> Si è scelto Leitner e non SM-2 (Anki) perché non richiede dati in più (usa lo `streak` che esisteva già), è spiegabile in una tabella e non chiede all'utente di valutare "quanto era facile".

## 3. Parole del giorno

File: `src/content/wordBank.ts` (dati), `src/domain/dailyWords.ts` (regole), `src/services/dailyWords.ts` (sorgente), `src/store/dailyStore.ts` (memoria), `src/hooks/useDailyWords.ts` (collante), `src/components/DailyWordsCard.tsx` (UI).

### La lista integrata
258 parole, dall'A1 al C2 (39 A1, 50 A2, 53 B1, 44 B2, 40 C1, 32 C2), **ogni riga è un concetto in tutte e cinque le lingue**:
```ts
['B1', 'battery', 'batteria / pila', 'batería / pila', 'batterie / pile', 'Batterie'],
//      en         it                 es                fr                 de
```
Così la stessa lista funziona per qualunque coppia: se studi italiano con lingua madre inglese, la parola è `batteria` e la traduzione `battery`. Le alternative separate da ` / ` sono: la **prima** è la parola suggerita, **tutte** sono accettate come traduzione.

### Come vengono scelte
1. Si tengono le parole del **livello** scelto (Impostazioni: Tutti / A1–A2 / B1–B2 / C1–C2).
2. Si tolgono quelle **già nel vocabolario** (qualsiasi alternativa) e quelle segnate **"La so già"**.
3. Si mescolano con un generatore casuale **con seme** = `giorno + coppia di lingue`: lo stesso giorno escono sempre le stesse parole, il giorno dopo altre.
4. Si prendono le prime 5, saltando i doppioni: in alcune lingue due concetti hanno la stessa parola (*improve* e *enhance* → "migliorare") e non devono uscire insieme.

Il risultato viene **salvato** in `dailyStore` (con giorno e livello): così aggiungendo una parola la lista non cambia sotto le dita. Si ricalcola solo quando cambia il giorno, la coppia di lingue o il livello.

### Le azioni
- **+ Aggiungi** → crea la parola (con il livello CEFR) nel vocabolario. Diventa "nuova", quindi entra nel ripasso di oggi.
- **La so già** → l'id finisce in `knownIds` (per lingua studiata) e non verrà più proposto. **Annulla** lo toglie. In Impostazioni si possono riproporre tutte.
- **Allenati sulle N parole nuove** → apre il quiz solo su quelle (`ids=` nei parametri del quiz).
- Se il livello è esaurito, la card lo dice e suggerisce di cambiare livello.

### Passare a un server (futuro)
`services/dailyWords.ts` definisce l'interfaccia `DailyWordsSource` e contiene già `createRemoteDailyWordsSource(baseUrl)`. Per attivarlo:
```ts
export const dailyWordsSource = createRemoteDailyWordsSource('https://api.example.com');
```
API attesa:
```
GET /daily-words?source=en&target=it&level=intermediate&day=2026-10-29
200 → { "entries": BankEntry[] }     // qualche decina di candidati, stesso formato della lista integrata
```
Scelte fatte apposta:
- Il server manda **candidati**, il telefono fa la scelta finale con le stesse regole → **il vocabolario dell'utente non lascia mai il telefono**.
- Timeout 5 s; se il server non risponde o non ha parole nuove si usa **la lista integrata** (l'app non resta mai vuota offline).

## 4. Il quiz

File: `src/domain/quiz.ts`, `src/app/(tabs)/train/quiz.tsx`.

**Parametri della rotta** (così Home può aprire direttamente un quiz):
`/train/quiz?direction=forward|backward&mode=due|all|mistakes&count=10&ids=a,b,c`

| Modalità | Parole usate |
|---|---|
| `due` — Da ripassare | scadute oggi secondo il ripasso spaziato (le più in ritardo prima) |
| `all` — Tutte | tutte, in ordine casuale |
| `mistakes` — Errori | sbagliate almeno una volta e non ancora corrette con **2 giuste di fila** |

**Direzioni**
- *Avanti* (🇬🇧→🇮🇹): mostra la parola, accetta **una qualsiasi** delle sue traduzioni.
- *Indietro* (🇮🇹→🇬🇧): mostra **una** traduzione a caso e accetta **tutte** le parole del vocabolario con quella traduzione (chiedendo "noioso" valgono sia *boring* che *dull*). Due parole con la stessa traduzione non generano due domande uguali.

**Durante il quiz**: barra di avanzamento; *Non lo so* conta come errore; **Termina** (in alto) chiude il quiz e mostra il risultato delle sole domande risposte. Dopo la risposta compaiono esempi e link ai dizionari (WordReference, Reverso).
**Risultati**: punteggio, elenco errori, **Rifai gli errori** (un nuovo giro solo su quelle parole), *Allenati ancora*.

Ogni risposta aggiorna subito le statistiche della parola e segna oggi come giorno di allenamento.

## 5. Come viene corretta una risposta

File: `src/domain/text.ts` → `evaluateAnswer(risposta, accettate, lingua)` restituisce `correct`, `almost` o `wrong`.

1. Si normalizza: minuscole, spazi doppi, apostrofo tipografico `’` → `'`.
2. Si toglie l'**articolo iniziale** della lingua della risposta: `the/a/an/to` (en), `il/lo/la/i/gli/le/l'/un/uno/una/un'` (it), `el/la/los/las/un/una…` (es), `le/la/les/l'/un/une/des/se/s'` (fr), `der/die/das/ein/eine/einen` (de). Vale su entrambi i lati: "to give up" = "give up".
3. Si può scrivere più di una risposta con `/` ("pila / batteria"): **tutte** devono essere giuste.
4. Per ogni risposta:
   - uguale a una accettata → **correct**
   - uguale togliendo gli accenti ("citta" per "città") → **almost**
   - parola di **almeno 6 lettere** con **una sola** lettera diversa, mancante o in più ("bateria") → **almost**
   - altrimenti → **wrong**

   Sotto le 6 lettere si è severi: "casa"/"cosa" sono parole diverse.
5. "Almost" **conta come giusta** per le statistiche, ma il quiz mostra *"Quasi! Attenzione a come si scrive: …"*.

## 6. Serie di giorni 🔥

File: `src/domain/activity.ts`, `src/store/activityStore.ts`.
Un giorno conta se hai risposto ad almeno una domanda. La serie è il numero di giorni consecutivi fino a oggi; **non si azzera finché oggi non è finito** (se ti sei allenato ieri e oggi non ancora, la serie resta).

## 7. Parole: lista, dettaglio, esempi

- **Lista** (`words/index.tsx`): `FlatList` virtualizzata (fluida con centinaia di parole), ricerca su parola/traduzioni/tag, ordinamento. Ogni riga mostra la barra a 5 segmenti della scatola Leitner e il numero di errori.
- **Dettaglio** (`words/[id].tsx`): card **Progressi** (giuste/sbagliate, prossimo ripasso: oggi / domani / tra N giorni) + modulo di modifica.
- **Nuova parola**: niente duplicati nella stessa coppia (confronto senza maiuscole/spazi).
- **Frasi di esempio**: da [Tatoeba](https://tatoeba.org) (CC BY), con traduzione nella lingua madre; ogni frase aggiunta va sotto la traduzione che contiene.

## 8. Backup

File: `src/domain/backup.ts`, `src/services/backupFiles.ts`.
- **Esporta**: file JSON `{ app, version: 2, exportedAt, words }` condiviso col foglio di condivisione (File, AirDrop, mail…). Include statistiche, livello e date di ripasso.
- **Importa**: accetta il formato dell'app e quello della **vecchia PWA** (`{ english, italian }`, importato come Inglese → Italiano). Una parola già presente non viene duplicata: si aggiungono solo le traduzioni mancanti.

## 9. Design system

File: `src/theme/` e `src/components/`.

### Token (`theme/tokens.ts`)
| Gruppo | Valori |
|---|---|
| `spacing` | xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 |
| `radius` | sm 12 · md 18 · lg 24 · pill |
| `fontSize` | caption 12 · small 14 · body 16 · large 18 · title 22 · hero 30 · display 40 |
| `fontWeight` | regular 500 · bold 700 · heavy 800 |
| `iconSize` | sm 18 · md 22 · lg 26 |
| `touchTarget` | 44 (minimo per qualsiasi cosa toccabile) |
| `barHeight` | 8 (barre di avanzamento) |

### Colori (`theme/colors.ts`)
Stessi nomi in chiaro e scuro, i componenti usano solo i nomi:

| Nome | Uso |
|---|---|
| `background`, `card`, `cardMuted`, `border`, `track` | superfici, bordi, parte vuota delle barre |
| `text`, `textMuted` | testo principale e secondario |
| `accent` | verde menta del marchio, **solo decorazione** (barre, segmenti) |
| `primary`, `primaryStrong`, `primarySoft`, `onPrimary` | azioni: testo verde, bottoni pieni, sfondi tenui |
| `danger(Soft)`, `warning(Soft)` | eliminazione/errori, avvisi |

**Perché due verdi in chiaro**: il menta originale (`#2fbf71`) con testo bianco ha contrasto 2.4:1 (illeggibile per molti). Ora i bottoni e i testi verdi usano `#167a46` (5.4:1) e il menta resta per le decorazioni. Anche il rosso è passato da `#ff3b30` (3.5:1) a `#d70015` (5.4:1). In scuro tutti i valori erano già sopra 4.5:1.

### Componenti
| Componente | Quando usarlo |
|---|---|
| `AppText` | **sempre** al posto di `<Text>`: varianti `display, hero, title, body, bodyBold, small, caption` + `color` del tema |
| `Button` | toni `primary` (una per schermata), `secondary`, `danger`; taglie `md` (larghezza piena) e `sm` (azioni dentro una riga) |
| `IconButton` | bottone solo-icona rotondo 44 pt; `accessibilityLabel` obbligatoria |
| `HeaderButton` | testo o simbolo nell'intestazione ("+", "Fine", "Termina") |
| `Card` | blocco di contenuto; con `onPress` diventa tutta toccabile; `tone="primary"` per evidenziare |
| `Pill` | etichetta piccola (livello, "2 errori", "Aggiunta ✓") |
| `SegmentedControl` | 2–4 scelte esclusive su una riga |
| `OptionList` | elenco con spunta (stile Impostazioni iOS) |
| `Section` | titolo maiuscoletto + contenuto + suggerimento |
| `TextField` | campo di testo con i colori del tema |
| `StatTile` | un numero grande con etichetta; 2–3 in fila |
| `ProgressBar` | avanzamento 0–1, annunciato dallo screen reader |
| `MasteryMeter` | 5 segmenti = scatola Leitner della parola |
| `Screen` / `ListScreen` | pagina scorrevole / lista lunga virtualizzata, con swipe tra le tab |
| `DailyWordsCard`, `WordStatsCard`, `WordForm`, `ExampleFinder`, `DictionaryLinks`, `LanguagePairChip` | blocchi specifici dell'app |

### Accessibilità
- Contrasto AA su tutti i testi (vedi sopra).
- Minimo 44 pt per bottoni, segmenti, chip e bottoni-icona.
- Etichette per screen reader su icone e azioni ripetute ("Aggiungi *quiet* alle mie parole").
- La barra di avanzamento e il misuratore annunciano il loro valore; il risultato della risposta è una *live region*.
- I campi che devono essere pronti per scrivere (risposta del quiz, nuova parola) prendono il focus **solo a fine animazione** (`hooks/useFocusAfterTransition.ts`), non con `autoFocus`: su iOS la tastiera aperta durante l'animazione faceva scorrere la pagina sotto l'intestazione.
- `Screen` mette lo ScrollView come prima vista della schermata (il contenitore extra serve solo alle tab per lo swipe): iOS calcola da lì lo spazio sotto l'intestazione.

## 10. Test

`npm test` esegue i test in `src/domain/__tests__/` (38 test): correzione delle risposte, intervalli del ripasso e cambi d'ora legale, costruzione dei quiz e sinonimi, scelta delle parole del giorno e integrità della lista (id unici, ogni parola in tutte le lingue, abbastanza parole per livello), serie di giorni.
Sono test della logica pura: girano in un secondo, senza telefono.

## 11. Limiti noti e prossimi passi

- **Sfide**: rimandate. L'idea più semplice senza server è un codice/link che contiene le parole e il punteggio da battere.
- **Versione web**: non è un obiettivo. Funziona per prove veloci (`npx expo start --web`), ma la barra delle tab nativa sul web si sovrappone all'intestazione.
- **Parole del giorno**: la lista integrata ha 258 parole. Con 5 al giorno bastano per circa 50 giorni col livello *Tutti* e per 2–3 settimane con un livello singolo (A1–A2: 89, B1–B2: 97, C1–C2: 72). Il passo naturale è il server descritto sopra (o allungare la lista: basta aggiungere righe).
- **Notifiche** ("hai 12 parole da ripassare"): richiedono `expo-notifications` e una development build.
