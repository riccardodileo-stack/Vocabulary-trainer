# Provare l'app sul proprio iPhone

Guida passo passo per vedere l'app sul tuo iPhone partendo da un PC **Windows** (su Mac è uguale, cambia solo il terminale).
Non serve un Mac, non serve un account sviluppatore Apple e non si paga nulla: si usa l'app gratuita **Expo Go**.

Tempo: ~15 minuti la prima volta, poi 30 secondi.

---

## Come funziona, in breve

```
PC (npx expo start)  ──Wi-Fi──►  iPhone (Expo Go)
     costruisce il JavaScript         scarica il JavaScript e lo esegue
```
Il PC fa da server; l'iPhone, tramite Expo Go, scarica il codice e lo esegue. Ogni volta che salvi un file sul PC, l'app sull'iPhone si aggiorna da sola in pochi secondi.

---

## 1. Sul PC: installa gli strumenti (una volta sola)

1. **Node.js LTS** — scaricalo da <https://nodejs.org> (versione **22** o **24**, *non* le dispari come 23 o 25; Expo richiede almeno la 22.13).
   Installalo con le opzioni predefinite.
2. **Git** — <https://git-scm.com/download/win> (se non ce l'hai già).
3. Controlla che funzionino: apri **PowerShell** (tasto Windows → scrivi "PowerShell") e scrivi:
   ```sh
   node -v     # deve stampare v22.x o v24.x
   npm -v
   git --version
   ```

## 2. Sull'iPhone: installa Expo Go (una volta sola)

1. Apri l'**App Store** e cerca **Expo Go** (sviluppatore: *650 Industries, Inc.*). Installala.
2. Deve essere una versione che supporta l'**SDK 58** (la 58.x). Se ce l'avevi già installata, aggiornala dall'App Store.
3. Non serve fare il login.

## 3. Sul PC: scarica il progetto e le dipendenze

Se hai già la cartella `Vocabulary-trainer` sul PC, salta il `git clone`.

```sh
git clone <indirizzo del repository> Vocabulary-trainer
cd Vocabulary-trainer/app
npm install
```

`npm install` scarica tutte le librerie nella cartella `node_modules` (qualche minuto la prima volta).
Va rifatto **ogni volta che cambia `package.json`** (per esempio dopo un `git pull` che aggiunge pacchetti).

## 4. Avvia il server

Sempre nella cartella `app/`:

```sh
npx expo start
```

Dopo qualche secondo compare un **QR code** nel terminale e la scritta `Metro waiting on exp://192.168.x.x:8081`.

> **Firewall di Windows**: la prima volta Windows chiede se consentire a *Node.js* l'accesso alla rete.
> Spunta **Reti private** e premi **Consenti accesso**. Se lo hai negato per sbaglio, vedi [Problemi](#problemi-e-soluzioni).

## 5. Apri l'app sull'iPhone

1. iPhone e PC devono essere sulla **stessa rete Wi-Fi**.
2. Apri l'app **Fotocamera** dell'iPhone e inquadra il QR code nel terminale.
3. Tocca il banner giallo *"Apri in Expo Go"*.
4. La prima volta iOS chiede: *"Expo Go vuole trovare dispositivi sulla rete locale"* → **Consenti** (senza questo permesso non si collega).
5. Parte il caricamento ("Bundling 100%" nel terminale) e poi si apre l'app. 🎉

Le volte successive: `npx expo start` sul PC, poi in Expo Go il progetto compare in **Recently opened**, basta toccarlo.

---

## Mentre lavori

| Cosa | Come |
|---|---|
| Vedere una modifica | salva il file: l'app si aggiorna da sola |
| Ricaricare tutto | premi `r` nel terminale, oppure scuoti l'iPhone → **Reload** |
| Menu sviluppatore (reload, performance, inspector) | scuoti l'iPhone, oppure premi `m` nel terminale |
| Vedere errori e `console.log` | compaiono nel terminale del PC |
| Fermare il server | `Ctrl + C` nel terminale |

**I dati** (parole, statistiche) restano salvati in Expo Go sull'iPhone anche chiudendo tutto.
Si perdono se disinstalli Expo Go: prima fai **Impostazioni → Esporta backup** nell'app.

---

## Problemi e soluzioni

| Sintomo | Causa | Soluzione |
|---|---|---|
| L'iPhone resta su "Opening project…" o dà *"Could not connect to the server"* | iPhone e PC non si vedono in rete. Succede spesso su **reti universitarie** (eduroam), hotspot pubblici, o con il firewall che blocca Node | Usa il tunnel: `npx expo start --tunnel` (la prima volta chiede di installare `@expo/ngrok`: rispondi **Y**). Funziona anche su reti diverse, ma è un po' più lento |
| Come sopra, a casa sulla stessa Wi-Fi | Firewall di Windows | Impostazioni di Windows → *Sicurezza di Windows* → *Firewall e protezione rete* → *Consenti app attraverso il firewall* → spunta **Node.js** su *Privato*. Controlla anche che la rete Wi-Fi del PC sia impostata come **Privata** |
| Expo Go non trova nulla anche col QR | Permesso "Rete locale" negato | iPhone: *Impostazioni → Privacy e sicurezza → Rete locale* → attiva **Expo Go** |
| *"Project is incompatible with this version of Expo Go"* | Expo Go e il progetto usano SDK diversi | Aggiorna Expo Go dall'App Store. Se Expo Go è già passato a un SDK più nuovo, va aggiornato il progetto: `npx expo install expo@latest --fix` (e poi controlla che tutto funzioni) |
| Schermata rossa con un errore | Errore nel codice | Leggi il messaggio (file e riga), correggi e salva: l'app si ricarica |
| Comportamenti strani dopo aver cambiato pacchetti | Cache vecchia | `npx expo start -c` (riavvia pulendo la cache) |
| `npm install` fallisce | Versione di Node sbagliata | `node -v`: deve essere 22.13+ o 24.x. Reinstalla Node LTS |
| Il QR non si legge | Terminale troppo piccolo | Ingrandisci la finestra, oppure in Expo Go tocca **Enter URL manually** e scrivi l'indirizzo `exp://…` mostrato nel terminale |

---

## Se un giorno Expo Go non bastasse

Expo Go contiene solo le librerie native "standard" di Expo. Per ora all'app basta. Servirà una **development build** (una versione dell'app tutta vostra, installata al posto di Expo Go) quando:
- si aggiunge una libreria con codice nativo non inclusa in Expo Go (es. notifiche avanzate, acquisti in-app);
- si vuole pubblicare l'app sull'App Store.

Su iPhone questo richiede l'**Apple Developer Program** (99 $/anno) ma non un Mac: le build si fanno sui server di Expo con EAS (`npx eas-cli@latest build --profile development --platform ios`).
Esiste anche `npx eas-cli@latest go`, che crea una propria copia di Expo Go su TestFlight (stesso account a pagamento): utile solo se l'App Store fosse indietro con la versione di Expo Go.

Guide ufficiali: [Expo Go](https://docs.expo.dev/get-started/expo-go/) · [Development build](https://docs.expo.dev/develop/development-builds/introduction/) · [Errori di versione di Expo Go](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)
