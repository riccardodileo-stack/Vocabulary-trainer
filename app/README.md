# Echo - WordKeeper — app nativa (iOS + Android)

**Echo - WordKeeper** (sotto l'icona: **Echo**, `name` in `app.json`; nome di lavoro: Vocabulary Trainer) è l'app per costruire il proprio vocabolario in una lingua straniera e ricordarlo nel tempo.
React Native con **Expo** (SDK 58) e **TypeScript**: lo stesso codice genera l'app per iPhone e Android.
Parole e progressi restano sul telefono e funzionano **offline**; account, amici e serie di giorni sono copiati su un server **Supabase** (branch `server`, `supabase/README.md`).

Il README ha due parti:
1. **[In breve](#parte-1--in-breve)** — cosa fa l'app, le scelte di design e come fare le cose più comuni.
2. **[Come funziona davvero](#parte-2--come-funziona-davvero)** — ogni funzione spiegata nel dettaglio, con le regole esatte e i file coinvolti.

---

# Parte 1 — In breve

## Cosa fa

| Schermata | A cosa serve |
|-----------|--------------|
| **Home** | Data e saluto personalizzato, selettore delle lingue, contatori con simboli e fiamma della serie a 1, 10, 100 e 1.000 giorni, con uno 🛡️ per ogni **salvaserie**; toccando la serie sale dal basso **La tua serie** (ultimi 7 giorni, salvaserie, record). Seguono **Ripasso di oggi**, **+ Aggiungi parola** e **Parole del giorno**, con il tasto **Categorie** per scegliere cosa imparare (Cibo, Viaggi, Salute…). |
| **Dizionario** | Il vocabolario della coppia di lingue attiva: ricerca, ordinamento (A–Z, recenti) e filtro **Errori** (solo le parole sbagliate, con i contatori errori/giuste), barra di "quanto la so" per ogni parola. Tocca una parola per vedere i progressi e modificarla. |
| **Allenati** | Quiz a risposta scritta: direzione (🇬🇧→🇮🇹 o al contrario), quali parole (*da imparare*, *tutte*, *errori*), con il tasto **Filtra** sotto: **categorie** (Informatica, Salute, Cibo…, anche più di una) e **tipo di parola** (sostantivi, verbi, aggettivi, altro), quante domande (10, 20, tutte o **Altro**: un numero a scelta da 1 a 200). |
| **Sfide** | In arrivo (rimandata di proposito). |
| **Benvenuto** (primo avvio, senza account) | **Registrati o accedi con la mail** (codice di 6 cifre, niente password) oppure **Continua come ospite** (scegli solo nick e immagine: uno dei 12 avatar o una **foto dalla galleria**). Il nick è **unico**: mentre lo scrivi l'app ti dice se è libero. |
| **Utente** | Il tuo nome come titolo della pagina; immagine profilo (12 avatar illustrati o una foto) con accanto il nick (`@stefano`), lingua studiata e data di inizio; contatori amici, record di giorni di fila e medaglie (ognuno apre dal basso la sua finestra: **Amici**, **La tua serie**, **Le tue medaglie**), **6 medaglie a 4 livelli** (bronzo, argento, oro, diamante), sezione **Amici** che apre la finestra degli amici: in alto *Aggiungi un amico* (cercando il nick o con il codice amico) e il tuo **codice amico**, sotto richieste e lista amici; account (ospite o mail), **Registrati** per gli ospiti, **Esci**, **Elimina account**. In alto a destra ⚙️ apre le Impostazioni. |
| **Impostazioni** (⚙️ in Utente) | Il tema chiaro/scuro direttamente nella pagina, poi le categorie che si aprono da destra: **Lingue** (lingua studiata, lingua madre, livello delle parole del giorno, lingua dell'app), **Suoni**, **Notifiche** (promemoria e orario), **Importa da elenco** (incolla un elenco `parola - traduzione` o scegli un file di testo/CSV), **Backup**. Accanto a ogni categoria si vede il valore attuale (es. `🇬🇧 → 🇮🇹 · B1–B2`, `On`, `18:00`). |
| **Lingue** (selettore 🇬🇧 → 🇮🇹 in Home o nel Dizionario) | Solo le scelte di studio: lingua studiata, lingua madre, livello delle parole del giorno. |

## Le scelte di design, in una riga ciascuna

- **Una sola azione principale al giorno**: in Home il bottone pieno è sempre *Inizia il ripasso*. Tutto il resto è secondario. Chi apre l'app per 2 minuti sa subito cosa fare.
- **Ripasso spaziato (sistema Leitner)** invece di quiz casuali: l'app chiede le parole quando stai per dimenticarle, non tutte ogni volta.
- **Parole del giorno = parole nuove**, 5 al giorno, scelte da una lista integrata, anche solo delle **categorie** che vuoi imparare. Il codice è già pronto per prenderle da un server: si cambia **una riga**.
- **Correzione indulgente ma onesta**: articoli ("la batteria", "to run") e accenti mancanti non sono errori; una lettera sbagliata in una parola lunga vale "Quasi!" e mostra come si scrive.
- **Local-first**: le parole e i progressi restano sul telefono (AsyncStorage, backup in un file JSON). Sul server (Supabase) ci sono solo l'account (ospite o mail), il profilo pubblico (nick unico, codice amico, avatar o foto), gli amici, la serie di giorni (attuale, record, salvaserie) e le categorie delle parole.
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

> ⚠️ Dopo aver scaricato queste modifiche serve **`npm install`**: sono stati aggiunti `@supabase/supabase-js`, `react-native-url-polyfill` (account e server) ed `expo-image-manipulator` (rimpicciolisce le foto prima di caricarle), tutti funzionano in Expo Go; `expo-audio` (suoni), `expo-notifications` (promemoria) ed `expo-image-picker` (foto profilo), oltre a `jest`, `jest-expo` e `@jest/globals` per i test. Sono tutti inclusi in Expo Go: non serve una development build.

## "Voglio…" → dove mettere le mani

| Voglio…                                                   | File                                                             |
|-----------------------------------------------------------|------------------------------------------------------------------|
| cambiare un colore (chiaro o scuro)                       | `src/theme/colors.ts` (controlla il contrasto, vedi Parte 2)     |
| cambiare spaziature, raggi, dimensioni di testo e icone   | `src/theme/tokens.ts`                                            |
| cambiare o aggiungere un testo                            | `src/i18n/en.ts` **e** `src/i18n/it.ts`                          |
| aggiungere parole del giorno                              | righe in `src/content/wordBank.ts`, nella sezione della loro categoria |
| rigenerare le categorie prese da Wiktionary               | `design/topic-model/wiktionary/` (vedi il suo README)            |
| prendere le parole del giorno da un server                | `dailyWordsSource` in `src/services/dailyWords.ts`               |
| cambiare quante parole del giorno al giorno               | `DAILY_WORDS_COUNT` in `src/domain/dailyWords.ts`                |
| cambiare gli intervalli del ripasso                       | `REVIEW_INTERVAL_DAYS` in `src/domain/review.ts`                 |
| cambiare quando una risposta è giusta / "quasi"           | `evaluateAnswer` in `src/domain/text.ts`                         |
| cambiare quando una parola esce dagli "errori"            | `MISTAKE_CLEAR_STREAK` in `src/domain/quiz.ts`                   |
| cambiare ogni quanti giorni si guadagna un salvaserie     | `DAYS_PER_SAVE` e `MAX_SAVES` in `src/domain/activity.ts` (se cambi `MAX_SAVES`, anche il controllo `saves between 0 and 2` sul server) |
| cambiare una regola del server (nick, amici, foto, serie) | una nuova migrazione in `supabase/migrations/` sul branch `server` |
| cambiare le opzioni "numero di domande"                   | `QUIZ_COUNTS` in `src/domain/quiz.ts`                            |
| riconoscere un altro formato di elenco da importare       | `SEPARATORS` in `src/domain/wordList.ts` (+ un caso in `wordList.test.ts`) |
| cambiare per quanto restano salvate le risposte dei siti  | `MAX_AGE_MS` e `MAX_ENTRIES` in `src/services/netCache.ts`       |
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
7. **Le regole del server stanno nel database** (funzioni in `supabase/migrations/`, branch `server`): l'app le chiama con `supabase.rpc(...)` da `src/services/`. Nell'app c'è solo la chiave pubblica (`anon`), **mai** la `service_role`.

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
   useAccount…     activityStore · dailyStore
   useStreakSync   profileStore · accountStore
                               │ chiama funzioni pure
                               ▼
                   src/domain/  (zero React, zero salvataggio, testato)
                   word · quiz · review · text · dates · dailyWords · activity · backup · account
                               ▲
   src/services/ ──────────────┘   (mondo esterno: file, Tatoeba, MyMemory, Wiktionary,
                                    server Supabase: supabase · account · streaks · topicServer)
   src/content/wordBank.ts          (dati: lista integrata delle parole del giorno)
```

Perché così:
- **`domain/` è puro**: date e numeri entrano come parametri (es. `today`), quindi le regole si testano senza telefono e senza orologio. È la parte che cambia più spesso, ed è quella coperta dai test.
- **`services/` isola il mondo esterno**: se domani le parole del giorno arrivano da un server, o i backup vanno su cloud, cambia solo quel file. Anche il server Supabase si usa solo da qui.
- **Gli store sono sottili**: tengono i dati e chiamano il dominio (es. `recordAnswer` usa `statsAfterAnswer`).

### Dati salvati sul telefono

| Chiave AsyncStorage | Store | Contenuto | Versione |
|---|---|---|---|
| `words` | `wordStore` | tutte le parole di tutte le coppie | 6 |
| `settings` | `settingsStore` | tema, lingue, livello parole del giorno, suoni, promemoria (attivo e ora), ultime scelte del quiz (numero di domande, tematiche, tipi) | 1 |
| `activity` | `activityStore` | giorni in cui ti sei allenato (max 2.000; da qui si calcolano serie e salvaserie), record di giorni di fila, quiz perfetti | 2 |
| `daily` | `dailyStore` | parole del giorno di oggi per coppia (con livello e categorie con cui sono state scelte) + parole segnate "la so già" | 1 |
| `achievements` | `achievementStore` | data in cui è stato raggiunto ogni livello di ogni medaglia | 1 |
| `profile` | `profileStore` | copia del profilo del server (id nascosto, nick, codice amico, avatar o foto con il suo percorso sul server, ospite o mail) + nome (solo sul telefono), contatori amici e richieste, data di inizio | 5 |
| `sb-…-auth-token` | supabase-js | la sessione dell'account (si rinnova da sola) | — |
| `net:…`, `net-index` | `services/netCache.ts` | risposte di Wiktionary, MyMemory e Tatoeba (30 giorni, max 400) | — |

All'avvio la splash screen resta visibile finché tutti gli store non sono caricati (`useStoresHydrated`).

### Il modello `Word`

```ts
{
  id, sourceLang: 'en', targetLang: 'it',
  term: 'battery',                                   // parola nella lingua studiata
  meanings: [{ text: 'batteria', note?: 'elettrica', examples: [], topics: ['tech'], topicsByUser?: true },
             { text: 'pila', examples: [], topics: [] }],
  stats: { correct, wrong, streak, lastWrongAt?, lastAnsweredAt? },
  level?: 'B1', tags: [], createdAt,
  topics: ['tech'],                                  // categorie di tutte le traduzioni insieme
  partOfSpeech: 'noun', partOfSpeechSource: 'dictionary', // noun | verb | adjective | other; guess | dictionary | user
}
```
Ogni coppia di lingue (es. 🇬🇧→🇮🇹) è un vocabolario separato. La coppia attiva = *lingua studiata → lingua madre* (Impostazioni).

**Migrazione v1 → v2** (`wordStore.migrate`): la v2 aggiunge `stats.lastAnsweredAt`. Per le parole esistenti si usa `lastWrongAt` se c'è; le parole mai sbagliate diventano "nuove" e quindi entrano subito nel ripasso.

**Migrazione v2 → v3**: aggiunge tematiche e tipo di parola. Al primo avvio ogni parola già salvata riceve le tematiche suggerite dalla rete neurale e il tipo stimato offline (`withClassification` in `domain/word.ts`); poi il tipo viene controllato su Wiktionary in sottofondo (vedi §4 bis). Anche i backup vecchi vengono classificati quando li importi.

**Migrazione v3 → v4 → v5**: nuovo modello delle categorie e categorie **per significato**: ogni traduzione riceve le sue; se avevi scelto a mano le categorie della parola, vanno a tutte le sue traduzioni (poi le puoi separare). Quando si rigenera il modello (`design/topic-model`) si aggiunge un passo che ricalcola quelle automatiche.

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
802 parole, dall'A1 al C2 (113 A1, 161 A2, 172 B1, 164 B2, 112 C1, 80 C2), **ogni riga è un concetto in tutte e cinque le lingue**, con le sue categorie:
```ts
['B1', 'battery', 'batteria / pila', 'batería / pila', 'batterie / pile', 'Batterie', ['tech']],
//      en         it                 es                fr                 de          categorie
```
Le prime 258 sono parole generali (alcune con una categoria evidente: *kitchen* → Casa, Cibo); seguono **circa 45 parole per ognuna delle 12 categorie**, scritte apposta: per ogni categoria circa 15 di livello A, 20 di livello B e 10 di livello C (un test controlla che ce ne siano almeno 10 per gruppo). Le traduzioni sono state confrontate con le tabelle di Wiktionary.
Così la stessa lista funziona per qualunque coppia: se studi italiano con lingua madre inglese, la parola è `batteria` e la traduzione `battery`. Le alternative separate da ` / ` sono: la **prima** è la parola suggerita, **tutte** sono accettate come traduzione.

### Come vengono scelte
1. Si tengono le parole del **livello** scelto (Impostazioni: Tutti / A1–A2 / B1–B2 / C1–C2) e, se ne hai scelte, delle **categorie** (almeno una in comune; le parole generali escono solo con *Tutte*).
2. Si tolgono quelle **già nel vocabolario** (qualsiasi alternativa) e quelle segnate **"La so già"**.
3. Si mescolano con un generatore casuale **con seme** = `giorno + coppia di lingue (+ categorie)`: lo stesso giorno escono sempre le stesse parole, il giorno dopo altre.
4. Si prendono le prime 5, saltando i doppioni: in alcune lingue due concetti hanno la stessa parola (*improve* e *enhance* → "migliorare") e non devono uscire insieme.

Il risultato viene **salvato** in `dailyStore` (con giorno e livello): così aggiungendo una parola la lista non cambia sotto le dita. Si ricalcola solo quando cambia il giorno, la coppia di lingue, il livello o le categorie.

### Le categorie
Nella card, accanto al titolo, il tasto **Categorie** (verde con il numero quando ne hai scelte) apre dal basso *Cosa vuoi imparare?* (`app/daily-topics.tsx`, *form sheet*): le 12 categorie, se ne possono scegliere più d'una, *Tutte* = nessun filtro. Accanto a ognuna quante parole nuove restano al tuo livello (`remainingCount`). La scelta è salvata (`dailyTopics` in `settingsStore`); chiudendo, le parole di oggi cambiano subito (quelle già aggiunte restano nel dizionario). Sotto il titolo della card compaiono le categorie scelte (`🍝 Cibo · ✈️ Viaggi`). Se le parole di quelle categorie al tuo livello sono finite, la card lo dice e offre *Cambia categorie*.

Una parola aggiunta da qui arriva nel dizionario **già con la sua categoria** (quella della lista, sicura), su ogni traduzione; si può cambiare come sempre.

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
GET /daily-words?source=en&target=it&level=intermediate&day=2026-10-29&topics=food,travel
200 → { "entries": BankEntry[] }     // qualche decina di candidati, stesso formato della lista integrata (topics facoltativo)
```
Scelte fatte apposta:
- Il server manda **candidati**, il telefono fa la scelta finale con le stesse regole → **il vocabolario dell'utente non lascia mai il telefono**.
- Timeout 5 s; se il server non risponde o non ha parole nuove si usa **la lista integrata** (l'app non resta mai vuota offline).

## 4. Il quiz

File: `src/domain/quiz.ts`, `src/app/quiz.tsx` (nello stack principale, sopra le tab: *Termina* e *Fine* tornano a dove il quiz è stato aperto, Home o Allenamento, e il quiz si chiude davvero).

**Parametri della rotta** (così Home può aprire direttamente un quiz):
`/quiz?direction=forward|backward&mode=due|all|mistakes&count=10&ids=a,b,c`

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

## 4 bis. Categorie (tematiche) e tipo di parola

File: `domain/topics.ts`, `domain/topicClassifier.ts`, `domain/partOfSpeech.ts`, `services/wiktionary.ts`, `hooks/useWordKindCheck.ts`, `components/ChoiceChips.tsx`.

**12 categorie**: 💻 Informatica · 🩺 Medicina e salute · 🍝 Cibo e cucina · ✈️ Viaggi e trasporti · 💼 Lavoro ed economia · 🏠 Casa e oggetti · 🌿 Natura e animali · 👪 Persone e famiglia · 🎓 Scuola e scienza · ⚽ Sport e tempo libero · 🎨 Arte e cultura · 😊 Emozioni e carattere.

**Le categorie sono di ogni significato, non della parola**: *stroke* = *ictus* → Salute, = *bracciata* → Sport, = *colpo* → nessuna. Ogni traduzione può averne più d'una (*pollame* = Cibo + Natura) o nessuna (*sempre*). Le categorie della parola (`word.topics`) sono quelle di tutte le sue traduzioni insieme e servono ai filtri e ai contatori.

**Chi le decide** (`suggestMeaningTopics`, gira sul telefono, offline, funziona in Expo Go): due fonti, i **sensi di Wiktionary** e una **rete neurale**, in quest'ordine:
- la **coppia** parola + traduzione è nei sensi di Wiktionary (*stroke* = *ictus* → Salute, *court* = *campo* → Sport, anche tra lingue senza inglese: *Schlaganfall* = *ictus*) → quelle categorie;
- la rete conosce la **traduzione** → le sue categorie (anche nessuna, *caserma*);
- Wiktionary conosce la **traduzione** da sola → le sue categorie abituali;
- se la parola ha un'unica traduzione, la parola studiata (prima la rete, poi Wiktionary).

**Il server** (`hooks/useServerTopicCheck.ts`, `services/topicServer.ts`, `services/serverConfig.ts`): le traduzioni rimaste **senza categoria** sul telefono (parole rare, coppie nuove: *stroke* = *bracciata*) vengono chieste in background, una alla volta, alla funzione `classify-meaning` del server Supabase (branch `server`, `supabase/README.md`). Il server risponde dalla sua tabella (~408.000 coppie di Wiktionary, tutte, anche le rare) o, per una coppia mai vista, chiede a un modello di linguaggio (Gemini) e salva la risposta per tutti. Ogni traduzione viene chiesta una volta sola (`meaning.topicsChecked`); senza rete si riprova al prossimo avvio; le categorie scelte a mano non vengono mai toccate. `services/serverContract.ts` è la copia del formato di domanda e risposta del server: se cambia uno, va copiato nell'altro. In `serverConfig.ts` c'è solo la chiave pubblica `anon` (le regole del database decidono cosa permette): le chiavi segrete non vanno mai nell'app.

**I sensi di Wiktionary** (`content/senseTopics.ts`, generato da `design/topic-model/wiktionary/`, vedi il suo README): dall'estratto di Wiktionary di kaikki.org si prendono, per ogni senso di ogni parola inglese, le etichette di settore (*medicine*, *cricket*…) e la tabella delle traduzioni; le etichette diventano le 12 categorie. Nell'app ~37.000 parole e ~50.000 coppie (le 50.000 parole più usate per lingua), 1,4 MB, aperte una lingua alla volta quando servono. Su un campione casuale sono giuste circa 9 volte su 10; le parole quotidiane (*cane*, *mela*) spesso non hanno etichetta e restano alla rete. La versione 6 dei dati salvati ricalcola le categorie automatiche delle parole già salvate (quelle scelte a mano restano).

**La rete neurale**:
1. al computer, un modello di linguaggio (Qwen2.5) ha etichettato un campione di parole e una rete addestrata su quelle etichette ha classificato le 75.000 parole più usate delle 5 lingue, con una soglia severa (meglio nessuna categoria che una sbagliata): il risultato è nell'app come lessico **per lingua** (`content/topicModel.ts`, generato);
2. per le parole non nel lessico c'è una piccola rete "studente" (gruppi di lettere → 24 neuroni → 12 categorie) che riconosce pezzi come *cardio*, *program*, *cucin*, e conta solo quando è sicura;
3. decide la **traduzione**; la parola studiata aiuta solo se ha un'unica traduzione che la rete non conosce (*rash* = *eruzione cutanea* → Salute). Al massimo 3 per significato.
4. Se la traduzione arriva da Wiktionary con un'etichetta di settore (*(medicine)*, *(tennis)*), la categoria arriva da lì (`topicsOfLabel`).
Misure di qualità, come è stata addestrata e come rigenerarla: `design/topic-model/README.md`. Quando ci sarà il server, la stessa funzione può chiedere a lui (modello più grande) senza toccare il resto.

**Nel modulo della parola**: ogni carta di traduzione ha la riga *Categorie: 🩺 Salute · Modifica* (`components/MeaningTopics.tsx`); *Modifica* apre le 12 categorie da spuntare. Finché non le tocchi seguono la traduzione mentre scrivi; scelte a mano (`meaning.topicsByUser`) non cambiano più, *Usa i suggerimenti* torna a quelle automatiche.

**Tipo di parola** (sostantivo, verbo, aggettivo, altro):
- *stima offline* (`guessPartOfSpeech`): "to run" → verbo; "il libro", "das Haus" → sostantivo; traduzione all'infinito ("correre") → verbo; finali tipiche (*-ous/-oso* → aggettivo, *-tion/-zione* → sostantivo); senza indizi → sostantivo.
- *Wiktionary* (`fetchPartOfSpeech`): chiede i tipi della parola e della sua prima traduzione e sceglie quello in comune (*boring* = sost./verbo/agg., *noioso* = agg./sost. → aggettivo).
- `partOfSpeechSource` dice chi l'ha deciso: `guess` → `dictionary` → `user`. All'avvio `useWordKindCheck` controlla su Wiktionary, una alla volta e con calma (una ogni 0,4 s), le parole ancora `guess`; senza rete riprova al prossimo avvio. Una scelta fatta a mano non viene mai cambiata.

**Tipo di parola nel modulo**: si compila da solo mentre scrivi (Wiktionary viene chiesto 0,8 s dopo l'ultimo tasto); se lo tocchi vale la tua scelta (`user`).

**Nel quiz** (Allenamento): sotto *Da imparare / Tutte / Errori* c'è il tasto **Filtra** (`components/FilterButton.tsx`; diventa verde con il numero di filtri attivi). Apre dal basso la finestra *Filtra le parole* (`app/quiz-filters.tsx`, *form sheet*) con due menu: **Categorie** e **Tipo di parola**, se ne possono scegliere più d'uno (*Tutte*/*Tutti* = nessun filtro). Accanto a ogni scelta c'è quante parole dà con le altre scelte attuali; una parola entra se **almeno una delle sue traduzioni** ha una delle categorie scelte e se è di **uno** dei tipi scelti (`matchesFilters` in `domain/quiz.ts`). Il quiz chiede **solo le traduzioni di quelle categorie** (`meaningsInScope`): in un quiz di Salute *stroke* vuole *ictus*, non *colpo*, e sotto la parola compare *🩺 Medicina e salute* per dire quale significato si chiede. Accanto al tasto compare il riassunto (`🍝 Cibo · 🌿 Natura · Sostantivi`) con *Azzera*. Le scelte restano salvate. Nella rotta: `/quiz?…&topics=tech,food&kinds=verb`.

**Blocchi** raggruppa le parole della coppia attiva per data di aggiunta, in gruppi da 50. I completamenti di ogni blocco sono salvati sul dispositivo. In Dizionario → Cronologico i gruppi sono separati da piccoli tratteggi.

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

File: `src/domain/activity.ts`, `src/store/activityStore.ts`, `src/app/streak.tsx`, `src/hooks/useStreakSync.ts`, `src/services/streaks.ts`.
Un giorno conta se hai risposto ad almeno una domanda. La serie è il numero di giorni di allenamento di fila fino a oggi; **non si azzera finché oggi non è finito** (se ti sei allenato ieri e oggi non ancora, la serie resta).

**Salvaserie 🛡️** (`streakStatus`): ogni **7 giorni di fila** se ne guadagna uno, se ne tengono al massimo **2** (con 2 in tasca non se ne guadagnano altri). Se salti un giorno ne viene usato uno da solo e la serie continua: il giorno saltato non aggiunge 1, ma non la interrompe. Se i giorni saltati sono più dei salvaserie, la serie riparte da 0 e i salvaserie restano. Non si salva niente in più: serie, salvaserie, giorni salvati e i totali (**guadagnati** e **usati** da sempre) si ricalcolano ogni volta dai giorni di allenamento, quindi valgono anche per le serie passate (il record conta anche i giorni salvati).

**Dove si vede.** In Home, accanto alla fiamma, uno 🛡️ per ogni salvaserie; toccando la serie (o il record in Utente) sale dal basso **La tua serie** (`app/streak.tsx`, *form sheet*): gli ultimi 7 giorni (✓ allenamento, 🛡️ giorno salvato, cerchio tratteggiato = oggi ancora da fare), i salvaserie con la barra verso il prossimo, quanti ne hai guadagnati e usati finora, il record.

**Sul server** (tabella `streaks`, una riga per utente): serie attuale, record, salvaserie disponibili, guadagnati, usati, ultimo giorno di allenamento e il giorno del calcolo (`as_of`). Il telefono li calcola (`streakSnapshot`) e li manda con `save_streak` (`useStreakSync`, montato in `app/_layout.tsx` solo con un account): all'apertura dell'app, quando torna in primo piano (il giorno può essere cambiato) e 2 secondi dopo un nuovo giorno di allenamento; numeri uguali all'ultimo invio non vengono rimandati. Offline non succede nulla: ci riprova alla prossima occasione. Il record sul server non scende mai: su un telefono nuovo (o dopo aver reinstallato l'app) torna in `activityStore`. Gli amici possono leggere la tua riga (servirà per le sfide).

## 7. Dizionario: lista, dettaglio, esempi

- **Lista** (`words/index.tsx`): `FlatList` virtualizzata (fluida con centinaia di parole), ricerca su parola/traduzioni/tag, ordinamento *A–Z* e *Recenti*. **Errori** è anche un filtro: mostra solo le parole sbagliate almeno una volta (`stats.wrong > 0`, anche se poi corrette), dalla più sbagliata, con i contatori *N errori* e *N giuste*; in alto il numero di parole sbagliate. Quando cambia ordine o filtro le righe scivolano al nuovo posto. Ogni riga mostra la barra a 5 segmenti della scatola Leitner.
- **Dettaglio** (`words/[id].tsx`): card **Progressi** (giuste/sbagliate, prossimo ripasso: oggi / domani / tra N giorni) + modulo di modifica.
- **Nuova parola**: niente duplicati nella stessa coppia (confronto senza maiuscole/spazi).
- **Cerca significati** (sotto il campo *Parola*, `components/MeaningFinder.tsx`): prima chiede a **Wiktionary** le traduzioni **divise per senso** (`domain/wiktionarySenses.ts`, `fetchSenses` in `services/wiktionary.ts`): per una parola inglese legge le tabelle *Translations* (una per senso: *stroke* → (act of hitting) colpo · (swimming) bracciata · (loss of brain function) ictus…), per una parola di un'altra lingua tradotta in inglese legge le definizioni. Segue le forme (*barracks* → *barrack*) e le sottopagine delle traduzioni (*run*). I sensi sono **ordinati dal più comune**: Wiktionary non lo dice, quindi si stima da in quante lingue è tradotto ogni senso (i sensi d'uso quotidiano sono tradotti in decine di lingue, quelli rari in poche: *stroke* → accarezzare 76, ictus 48, colpo 31… capovoga 2); dentro un senso le parole singole vengono prima delle espressioni (*ictus* prima di *accidente cerebrovascolare*). Mostra i primi 5 sensi con tipo di parola e spiegazione (in inglese), *Mostra altri N significati* per gli altri. Se Wiktionary non ha nulla (o nessuna delle due lingue è l'inglese) chiede le traduzioni a [MyMemory](https://mymemory.translated.net) (memoria di traduzione gratuita, senza account; limite anonimo ~5000 caratteri al giorno per dispositivo) e le mostra come chip. Toccandone una va nel primo campo traduzione vuoto, o in una traduzione nuova; quelle già presenti hanno ✓. `domain/meanings.ts` (`pickMeanings`) tiene solo le voci per quella parola esatta, toglie duplicati, la parola non tradotta e le frasi lunghe, e ordina per affidabilità (max 6); `services/meanings.ts` fa la chiamata. Per cambiare fonte basta riscrivere `fetchMeanings`.
- **Frasi di esempio**: da [Tatoeba](https://tatoeba.org) (CC BY), al massimo 3, con traduzione nella lingua madre; ogni frase aggiunta va sotto la traduzione che contiene.
- **Parola in grassetto negli esempi** (`domain/highlight.ts`, componente `HighlightedText`): nella frase la parola studiata, nella traduzione i suoi significati. Trova anche altre forme (*noioso → noiose*, *run → running*, *try → tries*) senza prendere parole diverse (*run* non evidenzia *runway*); ignora maiuscole, accenti e l'articolo o il "to" iniziale; una parola di più termini (*give up*) è in grassetto solo dove compare intera.
- Niente più link a WordReference e Reverso: i significati e gli esempi si vedono direttamente nell'app.
- **Memoria delle risposte dei siti** (`services/netCache.ts`): le risposte di Wiktionary (sensi e tipo di parola), MyMemory e Tatoeba restano salvate sul telefono per **30 giorni** (al massimo le ultime **400**, le più vecchie vengono tolte). Cercare di nuovo la stessa parola è immediato, funziona **senza rete** e non consuma il limite giornaliero di MyMemory. Se la rete non va si usa anche una risposta scaduta, meglio di niente. Ogni risposta è una voce di AsyncStorage `net:<servizio>:<lingue>:<parola>`, con l'elenco in `net-index`; non entra nel backup. Per cambiare durata o numero: `MAX_AGE_MS` e `MAX_ENTRIES`.

## 8. Backup

File: `src/domain/backup.ts`, `src/services/backupFiles.ts`.
- **Esporta**: file JSON `{ app, version: 2, exportedAt, words }` condiviso col foglio di condivisione (File, AirDrop, mail…). Include statistiche, livello e date di ripasso.
- **Importa**: accetta il formato dell'app e quello della **vecchia PWA** (`{ english, italian }`, importato come Inglese → Italiano). Una parola già presente non viene duplicata: si aggiungono solo le traduzioni mancanti.

## 9. Utente: profilo, medaglie, amici

File: `src/app/(tabs)/profile/index.tsx` (profilo), `src/app/(tabs)/profile/edit.tsx` (modifica), `src/app/friends.tsx` (amici), `src/store/profileStore.ts`, `src/domain/achievements.ts`.

**Account** (`hooks/useAccountSession.ts`, `services/account.ts`, `services/supabase.ts`, `store/accountStore.ts`, `app/welcome/`). Per usare l'app serve un account; ce ne sono due tipi, entrambi utenti di Supabase con un **id nascosto** (UUID) che è la chiave di tutto:
- **Ospite** (*Continua come ospite*): un utente anonimo di Supabase, creato scegliendo solo nick e avatar. Se cancelli l'app o cambi telefono l'account si perde: lo dicono la schermata iniziale e la pagina Utente.
- **Registrato con la mail**: si scrive la mail, arriva un **codice di 6 cifre**, lo si scrive nell'app. Lo stesso modulo serve per registrarsi e per rientrare su un altro telefono. Un ospite può **registrarsi in qualsiasi momento** (Utente → *Registrati con la mail*, `profile/register.tsx`): resta **lo stesso account** (stesso id, nick, codice amico e amici).
- **Google e Apple** arriveranno con la *development build* (Expo Go non basta; Apple richiede l'account sviluppatore, e l'App Store chiede Apple se c'è Google).

**Il flusso.** `app/_layout.tsx` usa `Stack.Protected`: senza account esistono solo le schermate `welcome/` (scelta → ospite / mail → nick e avatar), con l'account solo l'app. `useAccountSession` legge la sessione salvata (supabase-js in AsyncStorage) all'avvio: se il profilo copiato sul telefono è dello stesso account l'app si apre **subito, anche offline**, e il profilo si aggiorna dal server in background; un account nuovo senza profilo va a scegliere il nick (`welcome/profile.tsx`). *Esci* chiude la sessione (da ospite l'account si perde, l'app avvisa); *Elimina account* cancella sul server account, profilo, foto, amicizie e serie (richiesto dall'App Store). In entrambi i casi **le parole restano sul telefono**.

**Profilo.** Il server tiene la parte pubblica (nick, codice amico, immagine); il telefono ne tiene una copia (`profileStore`, per vederla offline) più il nome, che resta solo sul telefono. La chiave di tutto è l'**id nascosto**, non il nick: amicizie e serie puntano all'id, quindi cambiando nick gli amici vedono subito quello nuovo e il codice amico non cambia.

**Foto profilo.** Si sceglie dalla galleria (ritaglio quadrato) già alla creazione del profilo (`components/ProfilePictureChooser.tsx`) o dopo in *Modifica profilo*. Viene **rimpicciolita a 512×512 JPEG** (~60 KB, `expo-image-manipulator`) e caricata nello **storage di Supabase**, bucket `avatars`, nella cartella dell'utente: `<id nascosto>/<nome casuale>.jpg` (`uploadProfilePhoto` in `services/account.ts`). Il profilo salva il percorso (`photo_path`); gli amici la vedono nella lista amici. Il nome è casuale a ogni foto, così nessuna cache mostra quella vecchia; la foto precedente viene cancellata dal server. Sul telefono resta anche la copia locale (si vede offline); su un telefono nuovo si scarica dal server. Tornando a un avatar disegnato la foto viene tolta dal profilo e cancellata; con *Elimina account* vengono cancellate anche le foto.

| Campo | Cos'è | Regole (`domain/profile.ts`) |
|---|---|---|
| **Nome** | come ti chiami, è il titolo della pagina Utente e il saluto in Home | testo libero, max 30 caratteri |
| **Nick** | il tuo nome pubblico e **unico** (`@stefano`) | 3–20 caratteri: lettere senza accenti, numeri, `_` e `.`, deve iniziare con una lettera. Si salva in minuscolo e senza `@` (`@Stefano` = `stefano`). L'**unicità la garantisce il database**; mentre scrivi, `NicknameField` controlla prima la forma e poi (mezzo secondo dopo l'ultimo tasto) se è libero (`nickname_available`) |
| **Email** | la mail dell'account (solo per i registrati) | si vede in Utente → Account; si imposta registrandosi |
| **Codice amico** | es. `K7M2-X9PQ`: con questo gli amici ti aggiungono anche se cambi nick | lo **assegna il server**, unico, **mai modificabile**. 8 caratteri senza quelli che si confondono (niente 0/O, 1/I/L). Il codice che il telefono aveva già creato prima degli account viene tenuto se è libero |

La **versione 3** di `profileStore` trasforma il vecchio "nome utente" in *nome*, aggiunge il nick vuoto e crea il codice amico per chi aveva già l'app; la **versione 4** aggiunge id dell'account, ospite/mail e richieste di amicizia; la **versione 5** il percorso della foto sul server. Chi aveva già l'app trova nick, avatar e codice già compilati nella schermata *Continua come ospite*.

**Amici** (`src/app/friends.tsx`): si apre dal basso (*form sheet*, come la serie e le medaglie) toccando il contatore *amici* o la sezione **Amici** in Utente. In alto **Aggiungi un amico** e **il tuo codice amico** (con *Condividi*), sotto le **richieste ricevute** (*Accetta* / *Rifiuta*), **i tuoi amici** (*Rimuovi*) e le **richieste mandate** (*Annulla*). Per aggiungere c'è un solo campo, *Nick o codice amico*. Scrivendo almeno 3 caratteri di un **nick** (`@` e maiuscole non contano) l'app cerca sul server, mezzo secondo dopo l'ultimo tasto, e mostra fino a 10 persone il cui nick inizia così, con foto o avatar e un pulsante: *Aggiungi*, *Accetta* (se ti aveva già chiesto lui), oppure la scritta *Richiesta mandata* / *Amici ✓*. Se il testo è un **codice amico** completo (`abcd efgh` va bene, diventa `ABCD-EFGH`) compare *Manda richiesta a ABCD-EFGH*. In entrambi i casi gli arriva una **richiesta da accettare**. Se lui ti aveva già mandato una richiesta, diventate amici subito. La finestra si aggiorna ogni volta che la apri. In Utente la sezione Amici mostra quanti amici hai e le richieste da accettare. La ricerca per nick mostra solo nick e immagine (mai id o codice amico); un codice si può solo cercare esatto.

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

## 10. Impostazioni

File: `src/app/settings/`. Le impostazioni hanno una loro navigazione dentro la finestra modale (`settings/_layout.tsx`): la pagina principale (`index.tsx`) ha il tema e l'elenco delle categorie, e ogni categoria è una pagina che entra da destra con il tasto indietro.

| Pagina | Contenuto |
|---|---|
| `index.tsx` | tema (Sistema / Chiaro / Scuro) + categorie con il valore attuale a destra |
| `languages.tsx` | lingua studiata, lingua madre, livello delle parole del giorno (`components/StudySettings.tsx`, lo stesso della finestra Lingue della Home) e lingua dell'app |
| `sounds.tsx` | suoni del quiz (pensata per accogliere altre opzioni audio) |
| `notifications.tsx` | promemoria giornaliero e orario |
| `import-list.tsx` | **Importa da elenco**: vedi sotto |
| `backup.tsx` | esporta e importa |

"Fine" chiude tutta la finestra (è la prima pagina del suo stack, quindi tornare indietro la chiude).

**Importa da elenco** (`settings/import-list.tsx`, `domain/wordList.ts`): si incolla un elenco o si sceglie un file di testo/CSV, **una parola per riga** seguita dalle traduzioni, per la coppia di lingue attiva. Separatori riconosciuti, nell'ordine: tabulazione, trattino (`stroke - colpo, ictus`, anche – e —), `=`, `;`, `:` e la virgola; le traduzioni si dividono con virgola, `;` o `|`. Righe vuote, commenti (`# …`), elenchi puntati e numeri (`- `, `• `, `1. `) vengono ignorati; la stessa parola scritta due volte diventa una sola con tutte le traduzioni; al massimo 2.000 righe. Mentre scrivi si vede l'anteprima (prime 5 parole) e quante righe non hanno traduzione. *Aggiungi N parole* usa la stessa fusione del backup (`mergeWords`): una parola già presente non si duplica, riceve solo le traduzioni mancanti. Tipo di parola e categorie vengono assegnati come per ogni parola nuova (stima offline, poi Wiktionary e il server in background).

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
| `ChoiceChips` | scelte a chip che vanno a capo, una o più (con chip *Tutte* opzionale e contatore); il colore sfuma quando cambi |
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

`npm test` esegue 123 test, in `src/domain/__tests__/` e `src/services/__tests__/`: correzione delle risposte, intervalli del ripasso e cambi d'ora legale, costruzione dei quiz e sinonimi, scelta delle parole del giorno e integrità della lista (id unici, ogni parola in tutte le lingue, abbastanza parole per livello e per categoria, filtro per categorie), serie di giorni, salvaserie (guadagnati, usati) e record, dati della serie per il server, medaglie, passaggio fra i livelli e stima delle date, controllo di email e nick, testo della ricerca per nick, formato del codice amico, categorie dalla rete e dai sensi di Wiktionary, lettura degli elenchi di parole da importare, memoria delle risposte dei siti (con un AsyncStorage finto).
Sono test della logica pura: girano in un secondo, senza telefono.

## 14. Limiti noti e prossimi passi

- **Sfide**: rimandate. Ora ci sono server, amici e serie: le sfide si possono costruire lì (es. una riga per sfida con le parole e i punteggi dei due amici).
- **Versione web**: non è un obiettivo. Funziona per prove veloci (`npx expo start --web`), ma la barra delle tab nativa sul web si sovrappone all'intestazione.
- **Parole del giorno**: la lista integrata ha 802 parole (circa 45 per categoria). Con una sola categoria e un livello singolo bastano per pochi giorni (es. Cibo C1–C2: 10 parole = 2 giorni). Il passo naturale è il server descritto sopra (o allungare la lista: basta aggiungere righe).
- **Categorie da Wiktionary**: le parole rare (fuori dalle 50.000 più usate, es. *bracciata*) non sono nell'app per tenerla leggera: le chiede al server, che ha l'elenco completo.
- **Serie sul server**: è una fotografia dell'ultima volta che l'app è stata aperta (`as_of`). Se uno non apre l'app per giorni, sul server la serie resta quella vecchia anche se nel frattempo si è interrotta: chi la mostra (sfide, classifiche) deve guardare `as_of` e `last_training_day`.
- **Ricerca per nick**: chiunque abbia l'app può trovare un nick per inizio (vede nick e immagine). Se serve più privacy si può limitare al nick esatto.
- **Categorie automatiche**: con la soglia severa, sulle parole difficili di prova 9 categorie proposte su 10 sono giuste, ma ne trova circa metà (dettagli in `design/topic-model/README.md`): molte traduzioni restano senza categoria e si spuntano a mano. Con il server si può usare un modello più grande.
- **Wiktionary**: le spiegazioni dei sensi sono in inglese; per le coppie senza inglese (es. 🇪🇸→🇮🇹) restano le traduzioni di MyMemory, non divise per senso.
- **Tipo di parola**: senza connessione resta la stima offline, che sbaglia spesso con gli aggettivi senza finale tipica (*big*, *tired* → sostantivo). Si corregge da sola appena c'è rete (Wiktionary).
- **Login con la mail**: le mail con il codice partono da un Gmail (`echowordkeeper@gmail.com`) collegato a Supabase: possono finire nello **spam** e il limite è di 30 mail all'ora (~500 al giorno per Gmail). Prima della pubblicazione conviene un servizio di posta con un vostro dominio (vedi `supabase/README.md`).
- **Versione web**: i messaggi di conferma (`Alert`, es. *Esci*, *Rimuovi*) sul web non compaiono; sul telefono sì.
- **Notifiche push** (mandate da un server, per esempio "un amico ti ha sfidato"): richiedono una development build. Il promemoria giornaliero locale invece funziona già.
