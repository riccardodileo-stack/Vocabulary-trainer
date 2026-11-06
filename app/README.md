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
| **Home** | Il "cosa faccio oggi": il saluto (con il tuo nome) e in alto a destra il selettore delle lingue 🇬🇧 → 🇮🇹, che apre una finestra con solo lingue e livello, serie di giorni 🔥, numero di parole e parole imparate, **Ripasso di oggi**, **+ Aggiungi parola**, **Parole del giorno**, errori da correggere. |
| **Dizionario** | Il vocabolario della coppia di lingue attiva: ricerca, ordinamento (A–Z, recenti) e filtro **Errori** (solo le parole sbagliate, con i contatori errori/giuste), barra di "quanto la so" per ogni parola. Tocca una parola per vedere i progressi e modificarla. |
| **Allenati** | Quiz a risposta scritta: direzione (🇬🇧→🇮🇹 o al contrario), quali parole (*da imparare*, *tutte*, *errori*), quante domande (10, 20, tutte o **Altro**: un numero a scelta da 1 a 200). |
| **Sfide** | In arrivo (rimandata di proposito). |
| **Utente** | Il tuo nome come titolo della pagina; immagine profilo (12 avatar illustrati o una foto) con accanto il nick (`@stefano`), lingua studiata e data di inizio; contatore amici, record di giorni di fila, **6 medaglie a 4 livelli** (bronzo, argento, oro, diamante), sezione amici con la pagina **Aggiungi amici** e il tuo **codice amico**. In alto a destra ⚙️ apre le Impostazioni. |
| **Impostazioni** (⚙️ in Utente) | Il tema chiaro/scuro direttamente nella pagina, poi quattro categorie che si aprono da destra: **Lingue** (lingua studiata, lingua madre, livello delle parole del giorno, lingua dell'app), **Suoni**, **Notifiche** (promemoria e orario), **Backup**. Accanto a ogni categoria si vede il valore attuale (es. `🇬🇧 → 🇮🇹 · B1–B2`, `On`, `18:00`). |
| **Lingue** (selettore 🇬🇧 → 🇮🇹 in Home o nel Dizionario) | Solo le scelte di studio: lingua studiata, lingua madre, livello delle parole del giorno. |

## Le scelte di design, in una riga ciascuna

- **Una sola azione principale al giorno**: in Home il bottone pieno è sempre *Inizia il ripasso*. Tutto il resto è secondario. Chi apre l'app per 2 minuti sa subito cosa fare.
- **Ripasso spaziato (sistema Leitner)** invece di quiz casuali: l'app chiede le parole quando stai per dimenticarle, non tutte ogni volta.
- **Parole del giorno = parole nuove**, 5 al giorno, scelte da una lista integrata. Il codice è già pronto per prenderle da un server: si cambia **una riga**.
- **Correzione indulgente ma onesta**: articoli ("la batteria", "to run") e accenti mancanti non sono errori; una lettera sbagliata in una parola lunga vale "Quasi!" e mostra come si scrive.
- **Local-first**: nessun account, nessun server, dati in AsyncStorage. Backup in un file JSON.
- **Accessibile**: tutti i testi hanno contrasto WCAG AA (4.5:1), ogni elemento toccabile è almeno 44 pt, i bottoni-icona hanno un'etichetta per lo screen reader.
- **Uguale su ogni iPhone**: il testo scala con la larghezza dello schermo, quindi le righe vanno a capo negli stessi punti su un iPhone normale e su un Max.
- **Le scelte si muovono, non saltano**: cambiando un'opzione l'indicatore scivola, la spunta compare con un piccolo rimbalzo, i contenuti nuovi entrano in dissolvenza. Animazioni brevi (≤ 260 ms) e disattivate se il telefono ha "Riduci movimento".
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

> ⚠️ Dopo aver scaricato queste modifiche serve **`npm install`**: sono stati aggiunti `expo-audio` (suoni), `expo-notifications` (promemoria) ed `expo-image-picker` (foto profilo), oltre a `jest`, `jest-expo` e `@jest/globals` per i test. Sono tutti inclusi in Expo Go: non serve una development build.

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
| aggiungere una preferenza                                 | `src/store/settingsStore.ts` + la pagina della sua categoria in `src/app/settings/` |
| aggiungere una categoria di impostazioni                  | nuovo file in `src/app/settings/`, titolo in `settings/_layout.tsx`, riga in `settings/index.tsx` |
| cambiare o aggiungere un avatar                           | `design/avatars/` (generatore, vedi il suo README) + `src/content/avatars.ts` |
| aggiungere una medaglia o cambiarne i livelli             | `ACHIEVEMENT_RULES` (`targets`) in `src/domain/achievements.ts` + testi in `achievements` di `en.ts`/`it.ts` |
| cambiare i suoni                                          | i file in `assets/sounds/` (stessi nomi)                         |
| cambiare il testo o gli orari del promemoria              | `reminder` in `en.ts`/`it.ts`; `REMINDER_TIMES` in `src/app/settings/notifications.tsx` |
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
                │  Home · Dizionario · Allenati · Quiz · Utente · Impostazioni                            │
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
   src/services/ ──────────────┘   (mondo esterno: file, Tatoeba, MyMemory, sorgente parole del giorno)
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
| `settings` | `settingsStore` | tema, lingue, livello parole del giorno, suoni, promemoria (attivo e ora) | 1 |
| `activity` | `activityStore` | giorni in cui ti sei allenato (max 400), record di giorni di fila, quiz perfetti | 2 |
| `daily` | `dailyStore` | parole del giorno di oggi per coppia + parole segnate "la so già" | 1 |
| `achievements` | `achievementStore` | data in cui è stato raggiunto ogni livello di ogni medaglia | 1 |
| `profile` | `profileStore` | nome, nick, email, avatar (illustrato o foto), codice amico, contatore amici, data di inizio | 3 |

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
- Parola **mai chiesta** → è subito tra quelle "da imparare".
- **Imparata** 🏆 = scatola 5 (5 giuste di fila). È il numero "imparate" in Home e la barra piena nella lista.
- I conti sono in **giorni di calendario**, non in ore (`domain/dates.ts`): una parola ripassata alle 23:50 con intervallo 1 torna disponibile alle 00:00, e i cambi di ora legale non spostano nulla.

**Quiz "Da imparare"**: prende le parole scadute; se sono più del numero di domande sceglie le **più in ritardo**, poi le mescola. Il ripasso dalla Home chiede al massimo 20 parole.

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
| `due` — Da imparare | scadute oggi secondo il ripasso spaziato (le più in ritardo prima) |
| `all` — Tutte | tutte, in ordine casuale |
| `mistakes` — Errori | sbagliate almeno una volta e non ancora corrette con **2 giuste di fila** |

**Direzioni**
- *Avanti* (🇬🇧→🇮🇹): mostra la parola, accetta **una qualsiasi** delle sue traduzioni.
- *Indietro* (🇮🇹→🇬🇧): mostra **una** traduzione a caso e accetta **tutte** le parole del vocabolario con quella traduzione (chiedendo "noioso" valgono sia *boring* che *dull*). Due parole con la stessa traduzione non generano due domande uguali.

**Numero di domande**: 10, 20, *Tutte* o *Altro*. Con *Altro* compare un selettore − [numero] + (si può anche scrivere il numero): da 1 a 200 (`clampQuizCount` in `domain/quiz.ts`). Se le parole disponibili sono meno, il quiz le chiede tutte. L'ultima scelta e il numero personalizzato restano salvati (`quizCountChoice`, `quizCustomCount` in `settingsStore`).

**Durante il quiz**: barra di avanzamento; *Non lo so* conta come errore; **Termina** (in alto) chiude il quiz e mostra il risultato delle sole domande risposte. Dopo la risposta compaiono le frasi di esempio della parola, con la parola in grassetto (e la traduzione in grassetto nella frase tradotta).
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

## 7. Dizionario: lista, dettaglio, esempi

- **Lista** (`words/index.tsx`): `FlatList` virtualizzata (fluida con centinaia di parole), ricerca su parola/traduzioni/tag, ordinamento *A–Z* e *Recenti*. **Errori** è anche un filtro: mostra solo le parole sbagliate almeno una volta (`stats.wrong > 0`, anche se poi corrette), dalla più sbagliata, con i contatori *N errori* e *N giuste*; in alto il numero di parole sbagliate. Quando cambia ordine o filtro le righe scivolano al nuovo posto. Ogni riga mostra la barra a 5 segmenti della scatola Leitner.
- **Dettaglio** (`words/[id].tsx`): card **Progressi** (giuste/sbagliate, prossimo ripasso: oggi / domani / tra N giorni) + modulo di modifica.
- **Nuova parola**: niente duplicati nella stessa coppia (confronto senza maiuscole/spazi).
- **Cerca significati** (sotto il campo *Parola*): chiede le traduzioni a [MyMemory](https://mymemory.translated.net) (memoria di traduzione gratuita, senza account; limite anonimo ~5000 caratteri al giorno per dispositivo) e le mostra come chip. Toccandone una va nel primo campo traduzione vuoto, o in una traduzione nuova; quelle già presenti hanno ✓. `domain/meanings.ts` (`pickMeanings`) tiene solo le voci per quella parola esatta, toglie duplicati, la parola non tradotta e le frasi lunghe, e ordina per affidabilità (max 6); `services/meanings.ts` fa la chiamata. Per cambiare fonte basta riscrivere `fetchMeanings`.
- **Frasi di esempio**: da [Tatoeba](https://tatoeba.org) (CC BY), al massimo 3, con traduzione nella lingua madre; ogni frase aggiunta va sotto la traduzione che contiene.
- **Parola in grassetto negli esempi** (`domain/highlight.ts`, componente `HighlightedText`): nella frase la parola studiata, nella traduzione i suoi significati. Trova anche altre forme (*noioso → noiose*, *run → running*, *try → tries*) senza prendere parole diverse (*run* non evidenzia *runway*); ignora maiuscole, accenti e l'articolo o il "to" iniziale; una parola di più termini (*give up*) è in grassetto solo dove compare intera.
- Niente più link a WordReference e Reverso: i significati e gli esempi si vedono direttamente nell'app.

## 8. Backup

File: `src/domain/backup.ts`, `src/services/backupFiles.ts`.
- **Esporta**: file JSON `{ app, version: 2, exportedAt, words }` condiviso col foglio di condivisione (File, AirDrop, mail…). Include statistiche, livello e date di ripasso.
- **Importa**: accetta il formato dell'app e quello della **vecchia PWA** (`{ english, italian }`, importato come Inglese → Italiano). Una parola già presente non viene duplicata: si aggiungono solo le traduzioni mancanti.

## 9. Utente: profilo, medaglie, amici

File: `src/app/(tabs)/profile/index.tsx` (profilo), `src/app/(tabs)/profile/edit.tsx` (modifica), `src/store/profileStore.ts`, `src/domain/achievements.ts`.

**Profilo locale.** Non ci sono ancora account né server: i dati del profilo sono salvati solo sul telefono (`profileStore`). La struttura è già quella che servirà alla registrazione: quando arriverà il server, questi campi saranno i dati inviati al momento dell'iscrizione.

| Campo | Cos'è | Regole (`domain/profile.ts`) |
|---|---|---|
| **Nome** | come ti chiami, è il titolo della pagina Utente e il saluto in Home | testo libero, max 30 caratteri |
| **Nick** | il tuo nome pubblico e **unico** (`@stefano`), con cui gli amici ti cercheranno | 3–20 caratteri: lettere senza accenti, numeri, `_` e `.`, deve iniziare con una lettera. Si salva in minuscolo e senza `@` (`@Stefano` = `stefano`). L'unicità la verificherà il server: per ora si controlla solo la forma |
| **Email** | per l'account futuro | controllo leggero di forma; la verifica vera la farà il server |
| **Codice amico** | es. `K7M2-X9PQ`: con questo gli amici ti aggiungono anche se cambi nick | creato **una sola volta** al primo avvio e **mai modificabile**: `updateProfile` accetta solo nome, nick, email e immagine. 8 caratteri senza quelli che si confondono (niente 0/O, 1/I/L), facili da dettare. Tra codici casuali due uguali sono possibili ma rarissimi (31⁸ ≈ 850 miliardi di combinazioni): sarà il server, alla registrazione, a garantirne l'unicità |

La **versione 3** di `profileStore` trasforma il vecchio "nome utente" in *nome*, aggiunge il nick vuoto e crea il codice amico per chi aveva già l'app.

**Aggiungi amici** (`src/app/(tabs)/profile/friends.tsx`, dal bottone nella sezione Amici): in alto il campo per cercare un amico per nick o codice (disattivato fino all'arrivo del server; `normalizeFriendCode` accetta già `abcd efgh` → `ABCD-EFGH`), sotto **il tuo codice amico** in grande, selezionabile, con il bottone **Condividi il mio codice** (foglio di condivisione del telefono: WhatsApp, Messaggi, copia…).

**Immagine.** Si sceglie fra 12 avatar illustrati (6 donne e 6 uomini con carnagioni, capelli, età e accessori diversi: occhiali, barba, velo, turbante) oppure una foto dalla galleria. Gli avatar sono disegnati in codice: il generatore e i sorgenti SVG sono in `design/avatars/` (fuori dall'app), i PNG usati dall'app in `assets/avatars/`, l'elenco in `content/avatars.ts`. Un profilo nuovo parte con un avatar a caso; la versione 2 di `profileStore` sostituisce i vecchi avatar-animale con un avatar a caso. La foto è ritagliata quadrata e viene **copiata nei documenti dell'app** (`services/profilePhoto.ts`): la copia del selettore sta in una cache che il sistema può svuotare. Quando la foto viene sostituita o rimossa, il file vecchio viene cancellato. Le modifiche valgono solo premendo **Salva**.

**Medaglie.** 6 obiettivi, ognuno con **4 livelli**: 🥉 bronzo, 🥈 argento, 🥇 oro, 💎 diamante. Sono calcolati ogni volta dai dati che l'app ha già, quindi non possono "sfasarsi":

| Medaglia | Misura | Bronzo | Argento | Oro | Diamante |
|---|---|---|---|---|---|
| 📚 Vocabolario | parole nel dizionario (tutte le lingue) | 20 | 100 | 500 | 1000 |
| 🏆 Imparate | parole con 5 risposte giuste di fila (la metà del Vocabolario) | 10 | 50 | 250 | 500 |
| 🔥 Costanza | **record** di giorni di fila (se la serie si interrompe il livello resta) | 3 | 7 | 30 | 100 |
| 🎯 Precisione | risposte giuste in totale | 50 | 250 | 1000 | 5000 |
| 🎉 Quiz perfetti | quiz completati di almeno 5 domande senza errori | 1 | 5 | 20 | 50 |
| 🌍 Poliglotta | lingue studiate con almeno una parola | 2 | 3 | 4 | 5 |

Ogni medaglia mostra: il cerchio del colore del livello raggiunto (grigio e sbiadito se nessuno), quattro pallini per i livelli, il nome del livello e una barra verso il **prossimo** livello, nel suo colore: è riempita per `valore / obiettivo` (es. `120/500` verso l'oro = 24%), la stessa proporzione dei numeri scritti sotto. Toccandola sale dal basso una **finestra della medaglia** (`src/app/medal/[id].tsx`, presentata come *form sheet* nativo): i tuoi progressi (es. `120 / 500`, anche oltre il diamante: `1240 / 1000`), e per ognuno dei quattro livelli l'obiettivo, la **data in cui l'hai raggiunto** oppure quanti ne mancano (`Ne mancano 380 · 120/500`), con una barra sul prossimo livello.

**Date dei livelli.** Le medaglie sono calcolate, ma le date vanno salvate: `achievementStore` tiene la data di ogni livello (`"words:silver"` → data). Le registra `AchievementTracker` (`hooks/useAchievements.ts`), un componente invisibile nel layout principale che, ogni volta che cambiano parole o attività, data i livelli appena raggiunti, ovunque tu sia nell'app. Per i livelli raggiunti prima che le date esistessero si usa la stima migliore: per *Vocabolario* il giorno in cui hai aggiunto l'N-esima parola, per *Costanza* il giorno in cui hai completato la prima serie abbastanza lunga; per gli altri la data del primo avvio con questa versione. Il riquadro *medaglie* in alto conta i **livelli** conquistati: ogni livello vale uno, quindi una medaglia d'oro conta 3 (bronzo + argento + oro), su un totale di 6 × 4 = 24 (es. `8/24`). Toccandolo sale dal basso la finestra **Le tue medaglie** (`src/app/medals.tsx`): il totale e, dal diamante al bronzo, quante medaglie hanno quel livello (`2 su 6`) con le loro icone (`tierCounts` in `domain/achievements.ts`). Nella griglia ogni medaglia ha sempre la riga del livello (vuota se non ancora raggiunto), così sono tutte alte uguali e allineate. Il record di giorni e i quiz perfetti sono salvati in `activityStore`; la sua versione 2 ricostruisce il record dai giorni già salvati, quindi chi aveva già l'app non perde nulla.

**Amici.** Il contatore c'è già (sempre 0) e la sezione dice che arriveranno presto: aggiungere amici richiede il server.

## 10. Impostazioni

File: `src/app/settings/`. Le impostazioni hanno una loro navigazione dentro la finestra modale (`settings/_layout.tsx`): la pagina principale (`index.tsx`) ha il tema e l'elenco delle categorie, e ogni categoria è una pagina che entra da destra con il tasto indietro.

| Pagina | Contenuto |
|---|---|
| `index.tsx` | tema (Sistema / Chiaro / Scuro) + categorie con il valore attuale a destra |
| `languages.tsx` | lingua studiata, lingua madre, livello delle parole del giorno (`components/StudySettings.tsx`, lo stesso della finestra Lingue della Home) e lingua dell'app |
| `sounds.tsx` | suoni del quiz (pensata per accogliere altre opzioni audio) |
| `notifications.tsx` | promemoria giornaliero e orario |
| `backup.tsx` | esporta e importa |

"Fine" chiude tutta la finestra (è la prima pagina del suo stack, quindi tornare indietro la chiude).

## 11. Suoni e promemoria

**Suoni** (`services/sounds.ts`, file in `assets/sounds/`): un suono breve per risposta giusta o "quasi", uno per risposta sbagliata, una piccola fanfara a fine quiz. Sono toni sintetici generati apposta, quindi senza problemi di licenza. Rispettano l'interruttore silenzioso del telefono, si mescolano con la musica che stai ascoltando e si spengono in Impostazioni. Quando li riattivi senti subito un esempio.

*Ritardo*: caricare un suono e preparare l'audio richiede un attimo. Per questo `preloadSounds()` li carica quando si apre il quiz, e `playSound()` non aspetta nulla prima di partire (il riavvolgimento all'inizio non viene atteso).

**Promemoria** (`services/reminders.ts`, `hooks/useReminderSync.ts`): una notifica locale ogni giorno all'ora scelta (8:00, 13:00, 18:00 o 21:00). Locale vuol dire che la programma il telefono stesso: nessun server, funziona offline e in Expo Go.
- Il permesso viene chiesto **solo quando attivi l'interruttore**, mai all'avvio. Se lo neghi, l'interruttore torna spento e un messaggio spiega come riattivarlo dalle impostazioni del telefono.
- `useReminderSync` (nel layout principale) riprogramma la notifica quando cambi ora o lingua dell'app e la cancella quando la spegni. Aspetta che le impostazioni salvate siano caricate, altrimenti all'avvio i valori predefiniti la cancellerebbero.
- Il testo è generico ("È ora di ripassare! 🧠"): la notifica è programmata in anticipo, quindi non può sapere quante parole avrai da ripassare quel giorno.

## 12. Design system

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
| `motion` | `spring` (indicatori che si spostano) · `fast` 180 ms (dissolvenze) · `normal` 260 ms (barre, contenuti nuovi) |

**Testo proporzionale allo schermo**: i `fontSize` sono pensati per uno schermo largo 393 pt (iPhone 15/16/17). `useTextScale()` (`theme/index.ts`) li moltiplica per `larghezza / 393`, limitato tra 0.9 e 1.1, e `AppText` / `TextField` lo applicano da soli. Così una scritta che va a capo su un iPhone normale va a capo nello stesso punto su un Max. Le dimensioni di sistema scelte dall'utente (Testo più grande) si sommano come prima.

### Animazioni
Tutte con Reanimated e i token `motion`; con "Riduci movimento" attivo Reanimated le salta.

| Dove | Cosa si muove |
|---|---|
| `SegmentedControl` (ovunque) | la parte in rilievo scivola sotto l'opzione scelta |
| `OptionList` (lingue) | la spunta compare con un rimbalzo, quella vecchia sfuma |
| `SelectableCircle` (avatar in Modifica profilo) | l'anello cresce attorno all'avatar scelto; l'anteprima grande sfuma nel nuovo |
| `Section` | il suggerimento sotto (es. la spiegazione della modalità del quiz) sfuma nel nuovo testo |
| `ProgressBar` | la barra scorre al nuovo valore (quiz, finestra medaglia) |
| `ListScreen` (Dizionario) | le righe scivolano al nuovo posto quando cambiano ordine o filtro |
| `Appear` | contenuto che compare: orario del promemoria, selettore del numero di domande, esito della risposta, bottoni delle parole del giorno, domanda successiva (da destra) |

`Screen` avvolge il contenuto in `LayoutAnimationConfig skipEntering`: quando una pagina si apre tutto è già al suo posto, si animano solo i cambi successivi.

### Colori (`theme/colors.ts`)
Stessi nomi in chiaro e scuro, i componenti usano solo i nomi:

| Nome | Uso |
|---|---|
| `background`, `card`, `cardMuted`, `border`, `track` | superfici, bordi, parte vuota delle barre |
| `text`, `textMuted` | testo principale e secondario |
| `accent` | verde menta del marchio, **solo decorazione** (barre, segmenti) |
| `primary`, `primaryStrong`, `primarySoft`, `onPrimary` | azioni: testo verde, bottoni pieni, sfondi tenui |
| `danger(Soft)`, `warning(Soft)` | eliminazione/errori, avvisi |
| `bronze`, `silver`, `gold`, `diamond` (+ `…Soft`) | livelli delle medaglie: anello, pallini, barre (solo decorazione) |

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
| `SegmentedControl` | 2–4 scelte esclusive su una riga, con indicatore che scivola |
| `NumberStepper` | − [numero] + per un numero intero tra un minimo e un massimo (si può anche scrivere) |
| `SelectableCircle` | scelta rotonda in una griglia (avatar) con anello animato |
| `Appear` | fa entrare/uscire con un'animazione un contenuto che compare dopo una scelta |
| `OptionList` | elenco con spunta (stile Impostazioni iOS) |
| `ListGroup` + `ListRow` | righe raggruppate con icona, valore a destra, freccia o interruttore (Impostazioni, Account) |
| `Avatar` | immagine profilo rotonda: avatar disegnato o foto, con anello opzionale |
| `MedalBadge` | una medaglia a 4 livelli: cerchio del colore del livello, pallini, barra verso il prossimo |
| `StudySettings` | lingua studiata, lingua madre e livello: usato nella finestra Lingue e nelle Impostazioni |
| `Section` | titolo maiuscoletto + contenuto + suggerimento |
| `TextField` | campo di testo con i colori del tema |
| `StatTile` | un numero grande con etichetta; 2–3 in fila |
| `ProgressBar` | avanzamento 0–1, annunciato dallo screen reader |
| `MasteryMeter` | 5 segmenti = scatola Leitner della parola |
| `Screen` / `ListScreen` | pagina scorrevole / lista lunga virtualizzata, con swipe tra le tab |
| `HighlightedText` | testo con alcune parole in grassetto (la parola studiata negli esempi) |
| `DailyWordsCard`, `WordStatsCard`, `WordForm`, `MeaningFinder`, `ExampleFinder`, `LanguagePairChip` | blocchi specifici dell'app |

### Accessibilità
- Contrasto AA su tutti i testi (vedi sopra).
- Minimo 44 pt per bottoni, segmenti, chip e bottoni-icona.
- Etichette per screen reader su icone e azioni ripetute ("Aggiungi *quiet* alle mie parole").
- La barra di avanzamento e il misuratore annunciano il loro valore; il risultato della risposta è una *live region*.
- I campi che devono essere pronti per scrivere (risposta del quiz, nuova parola) prendono il focus **solo a fine animazione** (`hooks/useFocusAfterTransition.ts`), non con `autoFocus`: su iOS la tastiera aperta durante l'animazione faceva scorrere la pagina sotto l'intestazione.
- `Screen` mette lo ScrollView come prima vista della schermata (il contenitore extra serve solo alle tab per lo swipe): iOS calcola da lì lo spazio sotto l'intestazione.

## 13. Test

`npm test` esegue i test in `src/domain/__tests__/` (55 test): correzione delle risposte, intervalli del ripasso e cambi d'ora legale, costruzione dei quiz e sinonimi, scelta delle parole del giorno e integrità della lista (id unici, ogni parola in tutte le lingue, abbastanza parole per livello), serie di giorni e record, medaglie, passaggio fra i livelli e stima delle date, controllo di email e nick, formato del codice amico.
Sono test della logica pura: girano in un secondo, senza telefono.

## 14. Limiti noti e prossimi passi

- **Sfide**: rimandate. L'idea più semplice senza server è un codice/link che contiene le parole e il punteggio da battere.
- **Versione web**: non è un obiettivo. Funziona per prove veloci (`npx expo start --web`), ma la barra delle tab nativa sul web si sovrappone all'intestazione.
- **Parole del giorno**: la lista integrata ha 258 parole. Con 5 al giorno bastano per circa 50 giorni col livello *Tutti* e per 2–3 settimane con un livello singolo (A1–A2: 89, B1–B2: 97, C1–C2: 72). Il passo naturale è il server descritto sopra (o allungare la lista: basta aggiungere righe).
- **Amici e account**: richiedono un server. Il profilo locale (`profileStore`) è già pensato per essere inviato alla registrazione.
- **Notifiche push** (mandate da un server, per esempio "un amico ti ha sfidato"): richiedono una development build. Il promemoria giornaliero locale invece funziona già.
