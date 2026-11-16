# Server (Supabase)

Il server dell'app: database Postgres, login (ospiti e mail), storage delle foto e funzioni in TypeScript (*Edge Functions*).
Vive tutto in questa cartella e nel branch `server`: non tocca l'app.

## Cosa c'è

| File | A cosa serve |
|---|---|
| `config.toml` | configurazione del server locale (porte, login…) |
| `migrations/` | lo schema del database, un file per ogni modifica, in ordine di data |
| `seed.sql` | qualche riga di prova, caricata **solo** nel database locale |
| `templates/code.html` | testo della mail con il codice di 6 cifre (da caricare nel pannello, vedi *Login*) |
| `functions/_shared/contract.ts` | cosa ricevono e restituiscono le funzioni: lo stesso file andrà nell'app |
| `functions/classify-meaning/` | la prima funzione: categorie e tipo di una traduzione |

### Tabelle

- **`meaning_topics`**: una riga per *(lingua di partenza, lingua di arrivo, parola, traduzione)* → categorie (max 3) e tipo di parola, con chi le ha decise (`dictionary`, `model`, `user`). Condivisa da tutti: una coppia chiesta una volta non viene mai più chiesta al modello. Leggibile da tutti, scrivibile solo dalle funzioni. Le parole sono salvate in **forma chiave** (`keyForm` in `classify.ts`, uguale a `dictionaryForm` nell'app): minuscole, senza articolo o "to" iniziale, senza accenti (*"to bake"* → `bake`, *"la città"* → `citta`).
  Contiene già le **~408.000 coppie dei sensi di Wiktionary** (`source = 'dictionary'`, nelle due direzioni), caricate con `scripts/load_wiktionary.py` da `pairs.json` (generato da `app/design/topic-model/wiktionary/build.py`): la maggior parte delle domande non arriva mai al modello.
- **`model_usage`**: quante chiamate al modello di linguaggio sono state fatte oggi. `take_model_call(max)` conta una chiamata e dice se si è ancora sotto il limite: un errore o un abuso non possono far salire il conto.

- **`profiles`**: il profilo pubblico di ogni utente (ospite o registrato): `id` = l'id nascosto dell'utente (`auth.users`), `nickname` **unico** (minuscolo, 3–20 caratteri `a-z 0-9 _ .`, inizia con una lettera), `friend_code` **unico** dato dal server (`K7M2-X9PQ`, mai modificato), `avatar` (id di un avatar disegnato, usato quando non c'è una foto). La chiave è l'`id`, non il nick: amicizie e serie puntano all'id, quindi il nick si può cambiare senza rompere nulla (e un nick lasciato libero da qualcuno non eredita i suoi amici).
- **`profiles.photo_path`** e bucket di storage **`avatars`** (`migrations/20261116200000_profile_photos.sql`): la foto profilo, nella cartella dell'utente `<id>/<nome casuale>.jpg` (JPEG/PNG/WebP, max 1 MB; l'app manda 512×512 JPEG). Lettura pubblica (si trova solo conoscendo il percorso, che vedono solo amici e richieste); scrivere, sostituire e cancellare solo nella propria cartella. Le funzioni accettano solo percorsi nella cartella di chi chiama (`invalid_photo` altrimenti).
- **`friendships`**: amicizie e richieste: `requester` → `addressee`, `status` `pending` o `accepted`. Una sola riga per coppia di utenti.
- **`streaks`** (`migrations/20261116220000_streaks.sql`): la serie di giorni di ogni utente, una riga per utente: `current_streak` (serie attuale), `best_streak` (record, **non scende mai**), `saves` (salvaserie disponibili, 0–2), `saves_earned` e `saves_used` (salvaserie guadagnati e usati da sempre), `last_training_day`, `as_of` (il giorno del telefono in cui i numeri sono stati calcolati) e `updated_at`. La calcola il telefono dai suoi giorni di allenamento (l'app è *local-first*) e la manda con `save_streak`; il server controlla solo che i numeri siano coerenti (`best ≥ current`, `used ≤ earned`, `as_of` non nel futuro). Ognuno legge la propria riga e quelle degli amici (non delle richieste). ⚠️ È una fotografia: se l'app non viene aperta per giorni la serie resta quella dell'ultimo `as_of`.

I codici amico non si possono sfogliare (solo cercare esatti). I nick sì, ma solo per inizio (`search_profiles`, almeno 3 caratteri, massimo 10 risultati), che dà nick, avatar e foto, mai id o codice. Ognuno vede il proprio profilo completo e quelli di amici e richieste; tutte le scritture passano dalle funzioni qui sotto (`security definer`), che controllano le regole.

### Funzioni per account, amici e serie (`migrations/20261116190000_profiles_friends.sql` e successive)

| Funzione | Chi | Cosa fa |
|---|---|---|
| `nickname_available(nick)` | anche senza login | `true` se il nick ha la forma giusta ed è libero |
| `create_profile(nick, avatar, codice, foto)` | utente loggato | crea il profilo; tiene il codice amico proposto dall'app se libero, altrimenti ne crea uno; errori `nickname_taken`, `invalid_nickname`, `invalid_photo` |
| `update_profile(nick, avatar, foto)` | utente loggato | cambia nick, avatar e/o foto (`''` = togli la foto) |
| `send_friend_request(codice)` | utente loggato | risponde `sent`, `accepted` (lui ti aveva già chiesto), `already_friends`, `already_sent`, `not_found`, `self`, `too_many` (50 richieste in attesa) |
| `search_profiles(testo)` | utente loggato | fino a 10 profili il cui nick inizia col testo (min 3 caratteri, `@` e maiuscole ignorati; prima il nick esatto), con `relation`: `none`, `friend`, `incoming`, `outgoing`. Indice `profiles_nickname_prefix` (`migrations/20261116210000_friend_search.sql`) |
| `send_friend_request_by_nick(nick)` | utente loggato | come `send_friend_request`, col nick esatto al posto del codice |
| `respond_friend_request(id, accetta)` | chi ha ricevuto | accetta o rifiuta |
| `remove_friend(id)` | utente loggato | toglie un amico o annulla una richiesta |
| `my_friends()` | utente loggato | amici e richieste con nick, avatar e foto: `friend`, `incoming`, `outgoing` |
| `delete_my_account()` | utente loggato | cancella l'utente (e con lui profilo, amicizie e serie; le foto le cancella prima l'app) |
| `save_streak(attuale, record, salvaserie, guadagnati, usati, ultimo_giorno, as_of)` | utente loggato | salva la serie (`migrations/20261116220000_streaks.sql`) e restituisce la riga: il record è il più alto mai ricevuto, così un telefono nuovo se lo riprende; `invalid_streak` se i numeri non tornano |

### Login

- **Ospiti**: *anonymous sign-ins* attivi (online e in `config.toml`). Un ospite che si registra con la mail resta lo stesso utente (stesso id).
- **Mail con codice di 6 cifre** (niente link): l'app chiama `signInWithOtp` (accesso o nuovo account) o `updateUser({ email })` (ospite che si registra), poi `verifyOtp` con il codice. Codice di 6 cifre, valido 15 minuti (già impostato online).
- ✅ **Servizio di posta attivo** (16/11/2026): SMTP di Gmail (`echowordkeeper@gmail.com`, mittente "Echo - WordKeeper"), al massimo 30 mail all'ora (*Authentication → Rate Limits*), e i testi delle mail caricati (*Confirm signup*, *Magic Link*, *Change Email Address* → `templates/code.html`, oggetto con il codice). Gmail è pensato per la posta personale: le mail possono finire nello spam e il limite è ~500 al giorno. Per la pubblicazione meglio un servizio con un dominio vostro (es. Resend, Brevo): cambiano solo i campi SMTP.
- Come è stato configurato (per rifarlo o cambiarlo; sul piano gratuito i testi si possono cambiare solo con un SMTP proprio):
  1. un servizio SMTP gratuito, per i test il più semplice è **Gmail**: account Google → Sicurezza → verifica in due passaggi attiva → *Password per le app* → crea "Supabase";
  2. pannello Supabase → **Authentication → Emails → SMTP Settings** → attiva *custom SMTP*: host `smtp.gmail.com`, porta `465`, utente = il tuo indirizzo Gmail, password = la password per le app, mittente = lo stesso indirizzo, nome "Echo - WordKeeper";
  3. **Authentication → Emails → Templates**: in *Confirm signup*, *Magic Link* e *Change Email Address* metti come oggetto `{{ .Token }} è il tuo codice per Echo - WordKeeper` e come testo il contenuto di `templates/code.html`.
- Google e Apple: quando ci sarà la development build.

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

Stato attuale (16/11/2026): tutte le migrations applicate (fino a `20261116220000_streaks.sql`: profili, amici, foto, ricerca per nick, serie), ospiti attivi, `GEMINI_API_KEY` impostata, `classify-meaning` pubblicata, coppie di Wiktionary caricate. L'app (`porting_app`) usa già tutto.

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
3. ~~Login (ospiti e mail), profili e amici~~ (fatto, anche il servizio di posta per i codici).
4. ~~Foto profilo, ricerca amici per nick, serie e salvaserie~~ (fatto).
5. Sfide (possono usare `streaks` e `friendships`).
6. Google e Apple, con la development build.
