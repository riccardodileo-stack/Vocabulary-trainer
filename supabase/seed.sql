-- Example rows for the local database (npx supabase db reset loads them). Not used online.
insert into public.meaning_topics (source_lang, target_lang, term, translation, topics, part_of_speech, source) values
  ('en', 'it', 'stroke', 'ictus', '{health}', 'noun', 'dictionary'),
  ('en', 'it', 'stroke', 'bracciata', '{sport}', 'noun', 'dictionary'),
  ('en', 'it', 'stroke', 'colpo', '{}', 'noun', 'dictionary'),
  ('en', 'it', 'hen', 'gallina', '{nature,food}', 'noun', 'user'),
  ('en', 'it', 'keyboard', 'tastiera', '{tech}', 'noun', 'user');
