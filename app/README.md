# Vocabulary Trainer — app nativa (iOS + Android)

App React Native costruita con **Expo** (SDK 58) e **TypeScript**.
Lo stesso codice genera l'app per iPhone e per Android.

---

## Come provarla sul telefono

1. Installa **Expo Go** sul telefono (App Store / Play Store).
2. Nella cartella `app/`:
   ```sh
   npm install      # solo la prima volta o dopo aver aggiunto pacchetti
   npx expo start
   ```
3. Inquadra il QR code con la fotocamera (iPhone) o con Expo Go (Android).
   Ogni file salvato aggiorna l'app sul telefono in pochi secondi.

Se il telefono non si collega (reti universitarie, firewall di Windows): `npx expo start --tunnel`.

### Prima di fare commit
```sh
npx tsc --noEmit   # controllo dei tipi
npx expo lint      # controllo dello stile del codice
```

### Aggiungere un pacchetto
Usa sempre `npx expo install <pacchetto>` (non `npm install`): sceglie la versione compatibile con l'SDK.

---

## Struttura

```
src/
  app/                    SCHERMATE (ogni file è una pagina, il percorso è l'URL)
    _layout.tsx           radice: carica i dati salvati, applica il tema, dichiara tab e impostazioni
    settings.tsx          modale Impostazioni
    (tabs)/
      _layout.tsx         barra delle tab in basso (Home, Parole, Allenati, Sfide)
      index.tsx           Home
      words/              tab Parole (ha il suo Stack per le pagine di dettaglio)
      train/              tab Allenati
      challenges/         tab Sfide

  domain/                 LOGICA PURA (niente React, niente salvataggio)
    languages.ts          lingue supportate, coppie di lingue
    word.ts               il modello Word e le funzioni per crearlo e leggerlo
    text.ts               normalizzazione testo, controllo risposte

  store/                  DATI DELL'APP (salvati sul telefono)
    wordStore.ts          tutte le parole + azioni (aggiungi, modifica, elimina)
    settingsStore.ts      preferenze: tema, lingua app, lingua madre, lingua studiata
    persistStorage.ts     dove vengono salvati (AsyncStorage)
    useStoresHydrated.ts  aspetta che i dati salvati siano caricati all'avvio

  i18n/                   TESTI DELL'INTERFACCIA
    en.ts                 inglese (definisce l'elenco delle chiavi)
    it.ts                 italiano (stesse chiavi, TypeScript lo controlla)
    index.ts              hook useT() e scelta della lingua (sistema o manuale)

  theme/                  ASPETTO GRAFICO
    colors.ts             palette chiara e scura
    tokens.ts             spaziature, raggi, dimensioni del testo
    index.ts              useTheme() e applicazione della scelta chiaro/scuro/sistema

  components/             MATTONCINI DELL'INTERFACCIA riutilizzabili
    AppText, Card, Screen, Section, Pill, SegmentedControl, OptionList, ...

  navigation/
    tabStackOptions.ts    stile dell'intestazione condiviso dalle tab
```

---

## Come lavora

### Il flusso dei dati
```
schermata  ──legge──►  store (useWordStore, useSettingsStore)  ──salva──►  telefono
    │                         ▲
    └──chiama un'azione───────┘   (addWord, updateWord, setThemePreference, ...)
```
Quando un'azione cambia i dati, **tutte le schermate che li usano si aggiornano da sole**
e il salvataggio avviene in automatico. Non serve mai salvare o ridisegnare a mano.

Gli store usano [zustand](https://zustand.docs.pmnd.rs/). Esempio:
```tsx
const words = useWordsOfPair(useActivePair());           // leggere
const addWord = useWordStore((state) => state.addWord);  // ottenere un'azione
addWord(pair, { term: 'battery', meanings: [...] });     // modificare
```

### Lingue
- **Lingua madre** (`nativeLanguage`): la lingua delle traduzioni. All'inizio è quella del telefono.
- **Lingua studiata** (`studyLanguage`): inglese, spagnolo, francese o tedesco.
- Ogni coppia (es. 🇬🇧 → 🇮🇹) è un **vocabolario separato**: ogni parola ha `sourceLang` e `targetLang`.
- **Lingua dell'interfaccia**: segue il telefono, si può cambiare nelle Impostazioni.

### Tema
`Appearance.setColorScheme` applica la scelta (sistema / chiaro / scuro) a tutta l'app,
tastiera e barra delle tab comprese. I componenti prendono i colori da `useTheme()`:
**non scrivere mai colori fissi nei componenti**, aggiungili a `theme/colors.ts`.

---

## "Voglio modificare…" → dove

| Voglio…                                   | File                                         |
|-------------------------------------------|----------------------------------------------|
| cambiare un colore (chiaro o scuro)       | `src/theme/colors.ts`                        |
| cambiare spaziature o grandezza dei testi | `src/theme/tokens.ts`                        |
| cambiare o aggiungere un testo            | `src/i18n/en.ts` **e** `src/i18n/it.ts`      |
| aggiungere una lingua dell'interfaccia    | nuovo `src/i18n/xx.ts` + `TRANSLATIONS` in `src/i18n/index.ts` |
| aggiungere una lingua da studiare         | `src/domain/languages.ts` + nomi in `en.ts`/`it.ts` (`languages`) |
| aggiungere un campo alla parola           | `src/domain/word.ts` + `version`/`migrate` in `src/store/wordStore.ts` |
| aggiungere una preferenza                 | `src/store/settingsStore.ts` + `src/app/settings.tsx` |
| cambiare le tab o le loro icone           | `src/app/(tabs)/_layout.tsx`                 |
| aggiungere una pagina                     | nuovo file in `src/app/` (es. `(tabs)/words/[id].tsx` per il dettaglio) |

---

## ⚠️ Regole

1. **I dati si modificano solo con le azioni degli store**, mai modificando gli oggetti direttamente.
2. **Se cambi la forma dei dati salvati** (es. un campo di `Word`), aumenta `version` nello store
   e scrivi una funzione `migrate`, altrimenti chi ha già l'app installata avrà dati incompatibili.
3. **Ogni testo visibile passa da `useT()`**, mai scritto direttamente nel componente.
4. **Ogni colore passa da `useTheme()`**, così la modalità scura funziona ovunque.
5. In `src/app/` vanno **solo schermate**: componenti, logica e dati stanno nelle altre cartelle.
6. Le icone delle tab usano nomi **SF Symbols** (`sf`, iOS) e **Material Symbols** (`md`, Android).
