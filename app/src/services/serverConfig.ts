// Address of the app's server (Supabase project "vocabulary-trainer", see supabase/README.md on
// the `server` branch). The anon key is public by design: it only allows what the database rules
// (Row Level Security) allow, so it can live in the app. The secret keys never go here.

export const SERVER = {
  url: 'https://siwureexhbcmfznposll.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpd3VyZWV4aGJjbWZ6bnBvc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MzU2NTUsImV4cCI6MjExMDQxMTY1NX0.4A8MdjPLe0Yer4d86eJkP15tlEnnYxU8romWgk5MCiY',
};
