# Vocabulary Trainer

> 📱 La nuova app nativa (iOS + Android, Expo) è nella cartella [`app/`](app/README.md): lì trovi come avviarla, le scelte di design e come funziona ogni opzione. Questo README descrive la vecchia web app.

Web app (PWA) per costruire un vocabolario personale inglese ↔ italiano e allenarsi con quiz casuali.
Funziona offline e salva tutto nel browser (`localStorage`). Non ci sono dipendenze né build: solo HTML, CSS e JavaScript.

---

## Come avviarla

Il JavaScript è diviso in **moduli ES** (`import` / `export`), quindi l'app **non funziona aprendo `index.html` con doppio clic** (`file://`).
Serve un piccolo server locale, per esempio:

- VS Code → estensione **Live Server** → "Open with Live Server"
- oppure da terminale nella cartella del progetto: `python -m http.server` e poi apri `http://localhost:8000`

Online funziona su qualsiasi hosting statico (es. GitHub Pages).

---

## Struttura del progetto

```
index.html              struttura della pagina (tutte le schermate sono già qui, JS le mostra/nasconde)
manifest.json           dati della PWA (nome, icone, colori)
service-worker.js       cache per l'uso offline
icon-192.png / icon-512.png

css/
  base.css              variabili colore, reset, sfondo, titoli, utility (.hidden, .center)
  layout.css            contenitore principale, tab, sezioni, pannelli
  components.css        bottoni, campi, pill contatore, stato vuoto, toast
  vocabulary/
    word-list.css       lista parole, card parola, ricerca
    shared-translations.css   pannello "traduzioni condivise"
    add-word.css        box WordReference nella scheda "Add Word"
    backup.css          scheda Import / Export
  quiz/
    quiz.css            pannello quiz, schermata iniziale, parola, feedback, punteggio
    selection.css       schermata di scelta del pacchetto
    mistakes.css        elenco errori a fine quiz

js/
  main.js               punto di partenza: carica i dati e attiva tutto
  config.js             costanti e configurazione delle direzioni del quiz
  utils/
    text.js             funzioni sul testo (normalizza, confronta risposte, escape HTML)
    array.js            shuffle
  data/
    storage.js          lettura/scrittura JSON su localStorage
    wordStore.js        LE PAROLE: unico posto dove vengono lette e modificate
    completionStore.js  quante volte ogni quiz è stato completato
  ui/
    toast.js            messaggio temporaneo in basso
    tabs.js             tab principali e sotto-tab
    stickyTabs.js       effetto delle sotto-tab "attaccate" in alto durante lo scroll
  vocabulary/
    wordList.js         disegna la lista parole + ricerca
    wordActions.js      aggiungi / modifica / elimina parola
    sharedTranslations.js  trova parole inglesi con la stessa traduzione italiana
    dictionary.js       bottone WordReference + stato online/offline
    backup.js           export e import del file JSON
  quiz/
    quizState.js        stato di ogni quiz (domande, punteggio, errori…)
    quizElements.js     recupera gli elementi HTML di una direzione del quiz
    packages.js         divide le parole in pacchetti da 50 + "General Quiz"
    screens.js          passa tra schermata iniziale / selezione / quiz
    selection.js        disegna la lista dei pacchetti e avvia quello scelto
    quizEngine.js       logica del quiz: avvio, controllo risposta, avanti, fine
    quizView.js         aggiorna la pagina durante il quiz (solo grafica)
    mistakes.js         mostra/nasconde l'elenco degli errori
    quizSetup.js        collega bottoni e tasto Invio alle funzioni del quiz
```

---

## Come lavora l'app (in breve)

### 1. Avvio
`index.html` carica i CSS e un solo script: `js/main.js`.
`main.js` fa quattro cose, in ordine:

1. carica le parole e i contatori dei quiz da `localStorage`;
2. chiama le varie funzioni `setupXxx()` → ognuna collega i propri bottoni ai propri eventi;
3. si "iscrive" ai cambiamenti delle parole (`onWordsChange`) così la lista si ridisegna da sola;
4. registra il service worker.

### 2. Il flusso dei dati delle parole

```
  wordActions.js / backup.js            (l'utente aggiunge, modifica, elimina, importa)
            │
            ▼
       wordStore.js   ── salva su localStorage ──►  storage.js
            │
            ▼  avvisa chi si è iscritto con onWordsChange
  wordList.js + sharedTranslations.js  (si ridisegnano)
```

**Regola d'oro:** le parole si modificano **solo** tramite le funzioni di `wordStore.js`
(`addWord`, `addWords`, `updateWord`, `removeWord`). Così il salvataggio e l'aggiornamento
della pagina avvengono sempre, automaticamente. Non serve chiamare `renderWordList()` a mano.

Ogni parola è un oggetto semplice:
```js
{ english: "battery", italian: "batteria / pila" }
```
Lo `/` separa più traduzioni valide.

### 3. Il flusso del quiz

```
quizSetup.js     click su "START QUIZ"
     │
     ▼
selection.js     mostra i pacchetti (da packages.js) ── click "Start" ──┐
                                                                       ▼
quizEngine.js    startQuiz → checkAnswer → nextQuestion → finishQuiz / endQuiz
     │   aggiorna i dati in quizState.js
     ▼
quizView.js      aggiorna testo, feedback, bottoni e punteggio sulla pagina
```

- **quizEngine.js decide** (la risposta è giusta? il quiz è finito? quanti punti?).
- **quizView.js disegna** (quale messaggio mostrare, quali bottoni far vedere).
  Se vuoi cambiare un testo o un messaggio del quiz → `quizView.js`. Se vuoi cambiare una regola → `quizEngine.js`.

Le due direzioni (`eng-ita`, `ita-eng`) usano **lo stesso codice**. La differenza sta solo in `config.js`:

```js
"eng-ita": { questionField: "english", answerField: "italian", flexibleAnswers: true },
"ita-eng": { questionField: "italian", answerField: "english", flexibleAnswers: false }
```

`flexibleAnswers: true` significa che con una parola tipo `batteria / pila` è corretto rispondere
`pila`, `batteria` o `pila / batteria`. Con `false` la risposta deve essere uguale (ignorando maiuscole e spazi).

### 4. Gli id HTML del quiz seguono uno schema
`quizElements.js` trova gli elementi costruendo l'id con la direzione. Per esempio, per `eng-ita`:

| Elemento              | id                            |
|-----------------------|-------------------------------|
| domanda               | `eng-ita-question`            |
| campo risposta        | `eng-ita-answer`              |
| feedback              | `eng-ita-feedback`            |
| punteggio             | `eng-ita-progress`            |
| bottone controlla     | `check-eng-ita-button`        |
| bottone avanti        | `next-eng-ita-button`         |
| bottone termina       | `end-eng-ita-button`          |
| bottone torna all'inizio | `restart-eng-ita-button`   |
| bottone errori        | `view-eng-ita-mistakes-button`|

Se rinomini un id in `index.html`, aggiornalo anche in `quizElements.js`.

### 5. Cosa salva nel browser
| Chiave localStorage                   | Contenuto                                   | Gestita da            |
|---------------------------------------|---------------------------------------------|-----------------------|
| `vocabularyTrainerWords`              | elenco delle parole                         | `wordStore.js`        |
| `vocabularyTrainerQuizCompletions`    | `{ "eng-ita:package-1": 3, ... }`           | `completionStore.js`  |

I nomi delle chiavi sono in `config.js`. **Non cambiarli**, altrimenti chi usa già l'app perde le parole salvate.

---

## "Voglio modificare…" → dove mettere le mani

| Voglio…                                              | File                                                   |
|------------------------------------------------------|--------------------------------------------------------|
| cambiare i colori dell'app                           | `css/base.css` (variabili in `:root`)                  |
| cambiare un testo fisso (titoli, descrizioni)        | `index.html`                                           |
| cambiare l'aspetto delle card nella lista            | `css/vocabulary/word-list.css` + HTML in `js/vocabulary/wordList.js` (`createWordCardHtml`) |
| cambiare come funziona la ricerca                    | `js/vocabulary/wordList.js` (`getVisibleWords`)        |
| cambiare le regole per aggiungere/modificare parole (es. duplicati) | `js/vocabulary/wordActions.js` + controlli in `js/data/wordStore.js` |
| cambiare il formato del backup JSON                  | `js/vocabulary/backup.js`                              |
| cambiare il sito del dizionario                      | `WORDREFERENCE_URL` in `js/config.js`                  |
| cambiare quante parole ha un pacchetto quiz          | `QUIZ_PACKAGE_SIZE` in `js/config.js`                  |
| cambiare quando una risposta è considerata giusta    | `isAnswerCorrect` in `js/quiz/quizEngine.js` e `js/utils/text.js` |
| cambiare i messaggi "Correct!", "Not quite", punteggio finale | `js/quiz/quizView.js`                          |
| cambiare la card dei pacchetti nella selezione       | `js/quiz/selection.js` + `css/quiz/selection.css`      |
| cambiare l'elenco degli errori                       | `js/quiz/mistakes.js` + `css/quiz/mistakes.css`        |
| aggiungere/modificare una scheda (tab)               | `index.html` + mappa `panels` in `js/ui/tabs.js`       |
| cambiare durata del toast                            | `TOAST_DURATION_MS` in `js/ui/toast.js`                |
| cambiare la grafica su telefono                      | in fondo a ogni file CSS, nei blocchi `@media`         |

---

## Ricette comuni

### Aggiungere una nuova funzionalità (es. "statistiche")
1. Crea `js/stats/stats.js` con una funzione `setupStats()` che collega i suoi eventi.
2. Se serve, crea `css/stats.css`.
3. In `main.js`: `import { setupStats } from "./stats/stats.js";` e chiama `setupStats()` dentro `initApp()`.
4. In `index.html` aggiungi il `<link>` al nuovo CSS.
5. **Aggiungi i nuovi file in `service-worker.js`** (vedi sotto).

Se la funzione deve aggiornarsi quando cambiano le parole: in `main.js` aggiungi `onWordsChange(renderStats)`.

### Aggiungere una nuova direzione di quiz
1. In `config.js` aggiungi una voce a `QUIZ_DIRECTIONS`.
2. In `index.html` copia un blocco quiz esistente (es. `quiz-ita-eng-panel`) e sostituisci `ita-eng` con il nuovo nome in tutti gli id.
3. Aggiungi la sotto-tab in `index.html` e la voce nella mappa `panels` di `tabs.js`.

Eventi, stato e logica si attivano da soli per ogni direzione presente in `QUIZ_DIRECTIONS`.

### Aggiungere una funzione di utilità
Mettila in `js/utils/` (testo → `text.js`, array → `array.js`, altro → nuovo file) ed esportala con `export`.

---

## ⚠️ Regole da ricordare

1. **Ogni nuovo file JS o CSS va aggiunto a `FILES_TO_CACHE` in `service-worker.js`**, altrimenti offline non verrà trovato.
2. **Dopo ogni modifica pubblicata, aumenta `CACHE_NAME`** in `service-worker.js` (es. `v4.0` → `v4.1`), così i dispositivi scaricano la versione nuova.
3. **L'ordine dei `<link>` CSS in `index.html` conta**: prima `base`, `layout`, `components`, poi i file delle funzionalità.
4. **Le parole si modificano solo tramite `wordStore.js`.**
5. **Ogni file JS importa quello che usa** con `import { ... } from "./percorso.js"`. Il `.js` finale nel percorso è obbligatorio.
6. Il testo inserito dall'utente va sempre passato in `escapeHtml()` prima di metterlo in `innerHTML`.
