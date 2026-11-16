-- Topics (categories) and kind of word of each meaning: one row per
-- (source language, target language, word, translation), e.g. en→it "stroke" = "ictus" → {health}.
-- Shared by every user: a pair classified once is never asked to the model again.
-- Written only by the Edge Functions (service role); the app reads it through classify-meaning.

create table public.meaning_topics (
  source_lang     text not null check (source_lang in ('en', 'it', 'es', 'fr', 'de')),
  target_lang     text not null check (target_lang in ('en', 'it', 'es', 'fr', 'de')),
  -- Key form (keyForm in classify.ts, dictionaryForm in the app): lower case, no leading
  -- article or "to", no accents. "to bake" -> "bake", "la città" -> "citta"
  term            text not null check (char_length(term) between 1 and 80),
  translation     text not null check (char_length(translation) between 1 and 120),
  -- Same ids as TOPIC_IDS in app/src/domain/topics.ts; empty = no topic (e.g. "sempre")
  topics          text[] not null default '{}'
                  check (topics <@ array['tech', 'health', 'food', 'travel', 'work', 'home',
                                         'nature', 'people', 'school', 'sport', 'culture', 'feelings']::text[]
                         and cardinality(topics) <= 3),
  part_of_speech  text check (part_of_speech in ('noun', 'verb', 'adjective', 'other')),
  -- Who decided: 'dictionary' (Wiktionary labels), 'model' (language model), 'user' (hand-checked)
  source          text not null check (source in ('dictionary', 'model', 'user')),
  -- Which model, for 'model' rows (to redo them when a better one comes)
  model           text,
  created_at      timestamptz not null default now(),
  primary key (source_lang, target_lang, term, translation)
);

comment on table public.meaning_topics is
  'Topics and kind of word of each (word, translation) pair, shared by all users.';

alter table public.meaning_topics enable row level security;

-- Anyone with the app key may read (no personal data in it); nobody may write from the app
create policy "meaning_topics are readable by everyone"
  on public.meaning_topics for select
  to anon, authenticated
  using (true);

-- Calls to the language model per day: a cap keeps a bug or an abuse from running up the bill.
create table public.model_usage (
  day    date primary key default current_date,
  calls  integer not null default 0
);

alter table public.model_usage enable row level security;
-- No policy: only the service role (Edge Functions) can read or write it.

-- Counts one call for today and says whether it is still within the cap (atomic).
create or replace function public.take_model_call(max_calls integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  insert into public.model_usage as usage (day, calls)
  values (current_date, 1)
  on conflict (day) do update set calls = usage.calls + 1
  returning calls <= max_calls;
$$;

revoke all on function public.take_model_call(integer) from public, anon, authenticated;
grant execute on function public.take_model_call(integer) to service_role;
