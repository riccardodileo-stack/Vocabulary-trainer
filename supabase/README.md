# Server (Supabase)

Il server dell'app: database Postgres, login (più avanti) e funzioni in TypeScript (*Edge Functions*).
Vive tutto in questa cartella e nel branch `server`: non tocca l'app.

## Cosa c'è

| File | A cosa serve |
|---|---|
| `config.toml` | configurazione del server locale (porte, login…) |
| `migrations/` | lo schema del database, un file per ogni modifica, in ordine di data |
| `seed.sql` | qualche riga di prova, caricata **solo** nel database locale |
| `functions/_shared/contract.ts` | cosa ricevono e restituiscono le funzioni: lo stesso file andrà nell'app |
| `functions/classify-meaning/` | la prima funzione: categorie e tipo di una traduzione |

### Tabelle

- **`meaning_topics`**: una riga per *(lingua di partenza, lingua di arrivo, parola, traduzione)* → categorie (max 3) e tipo di parola, con chi le ha decise (`dictionary`, `model`, `user`). Condivisa da tutti: una coppia chiesta una volta non viene mai più chiesta al modello. Leggibile da tutti, scrivibile solo dalle funzioni. Le parole sono salvate in **forma chiave** (`keyForm` in `classify.ts`, uguale a `dictionaryForm` nell'app): minuscole, senza articolo o "to" iniziale, senza accenti (*"to bake"* → `bake`, *"la città"* → `citta`).
  Contiene già le **~408.000 coppie dei sensi di Wiktionary** (`source = 'dictionary'`, nelle due direzioni), caricate con `scripts/load_wiktionary.py` da `pairs.json` (generato da `app/design/topic-model/wiktionary/build.py`): la maggior parte delle domande non arriva mai al modello.
- **`model_usage`**: quante chiamate al modello di linguaggio sono state fatte oggi. `take_model_call(max)` conta una chiamata e dice se si è ancora sotto il limite: un errore o un abuso non possono far salire il conto.

### `classify-meaning`

```
POST /functions/v1/classify-meaning
{ "sourceLang": "en", "targetLang": "it", "term": "stroke", "translation": "ictus" }
→ { "ok": true, "topics": ["health"], "partOfSpeech": "noun", "source": "model", "cached": false }
```
1. se la coppia è già in `meaning_topics` risponde da lì (`cached: true`);
2. altrimenti chiede a Gemini (al massimo `MAX_MODEL_CALLS_PER_DAY` volte al giorno, 500 se non impostato), salva e risponde;
3. se il modello non c'è o non risponde: `{ ok: false, error: "unavailable" }` (HTTP 503) e l'app tiene la sua stima offline.

## Lavorare in locale

Serve Docker Desktop acceso. Dalla cartella del repo:

```powershell
npx supabase start          # avvia tutto in locale (la prima volta scarica qualche GB)
npx supabase db reset       # ricrea il database locale: applica migrations/ e seed.sql
npx supabase status         # indirizzi e chiavi locali (API URL, anon key, Studio)
```
Studio, il pannello per vedere le tabelle, è su http://127.0.0.1:54323.

**Provare la funzione.** Copia `functions/.env.example` in `functions/.env` e mettici la tua chiave Gemini (da https://aistudio.google.com/apikey; per sviluppare basta il piano gratuito). Poi:

```powershell
npx supabase functions serve              # lascialo aperto: si ricarica a ogni salvataggio
```
In un altro PowerShell (`<ANON_KEY>` = la *anon key* di `npx supabase status`):

```powershell
$headers = @{ Authorization = "Bearer <ANON_KEY>" }
$body = '{"sourceLang":"en","targetLang":"it","term":"stroke","translation":"ictus"}'
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:54321/functions/v1/classify-meaning -Headers $headers -ContentType 'application/json' -Body $body
```
*stroke/ictus* è nel `seed.sql`, quindi risponde subito con `cached: True`. Prova poi una coppia nuova, per esempio `"term":"wound","translation":"ferita"`: la prima volta risponde il modello (`cached: False`), la seconda il database.

**Test** (servono Deno, https://deno.com, oppure `npm i -g deno`):
```powershell
deno test supabase/functions/classify-meaning/classify.test.ts
```

## Pubblicare sul progetto online

Stato attuale (16/11/2026): schema applicato, `GEMINI_API_KEY` impostata, `classify-meaning` pubblicata, coppie di Wiktionary caricate. L'app (`porting_app`) la chiama già.

```powershell
npx supabase db push                                  # applica le nuove migrations al database online
npx supabase secrets set GEMINI_API_KEY=la-tua-chiave # una volta sola (e quando cambia)
npx supabase functions deploy classify-meaning        # senza Docker: aggiungi --use-api
```
`seed.sql` online **non** viene caricato.

**Ricaricare le coppie di Wiktionary** (dopo averle rigenerate; non tocca le righe `model` e `user`):
```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."   # token del progetto, permesso Database read-write
python supabase/scripts/load_wiktionary.py siwureexhbcmfznposll percorso\pairs.json
```

**Provare la funzione online** (`<ANON_KEY>`: Project Settings → API, o `src/services/serverConfig.ts` nell'app):
```powershell
$headers = @{ Authorization = "Bearer <ANON_KEY>" }
Invoke-RestMethod -Method Post -Uri https://siwureexhbcmfznposll.supabase.co/functions/v1/classify-meaning -Headers $headers -ContentType 'application/json' -Body '{"sourceLang":"en","targetLang":"it","term":"court","translation":"campo"}'
```
Risponde `source: dictionary` (dalla tabella). Se il modello non risponde, `message` dice perché (chiave sbagliata, modello sconosciuto…).

## Regole

- **Mai modificare una migration già pubblicata** (`db push`): per cambiare lo schema si crea un nuovo file con `npx supabase migration new nome-modifica`.
- La chiave **service_role** non va mai nel repo né nell'app. Nell'app va solo la **anon key**, che è pubblica: la proteggono le regole di accesso (*Row Level Security*), da attivare su **ogni** tabella nuova.
- `functions/.env` non va nel repo (è in `.gitignore`); `.env.example` sì.
- Se `supabase start` dice che una porta è *forbidden* (Windows la tiene riservata): `net stop winnat` e `net start winnat` da PowerShell amministratore, oppure cambia le porte in `config.toml`.
- **Gemini in produzione**: per un'app usata da utenti europei Google chiede il piano a pagamento (e il piano gratuito usa le richieste per migliorare i suoi prodotti). Costa poco perché il modello viene chiamato solo per le coppie mai viste.
- Il progetto gratuito **si mette in pausa dopo 7 giorni senza traffico**: si riattiva dal pannello di Supabase.

## Prossimi passi

1. ~~Riempire `meaning_topics` con i sensi di Wiktionary~~ (fatto).
2. ~~L'app chiede `classify-meaning` in background per le traduzioni rimaste senza categoria~~ (fatto: `useServerTopicCheck` in `porting_app`).
3. Login e profili (`profiles`: nick, codice amico, avatar), poi amici e sfide.
