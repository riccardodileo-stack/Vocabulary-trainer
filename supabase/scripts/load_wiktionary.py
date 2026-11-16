# Loads the Wiktionary topics of word pairs into meaning_topics (source = 'dictionary'), so the
# server answers most pairs without asking the language model.
#
#   SUPABASE_ACCESS_TOKEN=sbp_... python3 supabase/scripts/load_wiktionary.py <project-ref> pairs.json [first-row]
#
# pairs.json is made by app/design/topic-model/wiktionary/build.py: [lang_a, lang_b, word_a,
# word_b, [topics]] with lang_a < lang_b and words already in key form (no article, no accents).
# Every pair is written in both directions (en->it and it->en). Rows chosen by hand
# (source = 'user') or already classified by the model are never overwritten.
# Uses the Management API ("Run a query"), so it works without a direct database connection.
import json, os, sys, time, urllib.request

BATCH = 3000

def query(ref, token, sql):
    request = urllib.request.Request(
        f'https://api.supabase.com/v1/projects/{ref}/database/query',
        data=json.dumps({'query': sql}).encode(),
        headers={'Authorization': f'Bearer {token}', 'content-type': 'application/json',
                 'user-agent': 'vocabulary-trainer-loader'},
        method='POST',
    )
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.loads(response.read() or b'null')
        except urllib.error.HTTPError as error:
            body = error.read().decode()[:300]
            if error.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise SystemExit(f'HTTP {error.code}: {body}')

def main():
    ref, path = sys.argv[1], sys.argv[2]
    token = os.environ['SUPABASE_ACCESS_TOKEN']
    rows = []
    for a, b, x, y, topics in json.load(open(path, encoding='utf-8')):
        if len(x) > 80 or len(y) > 80:
            continue
        rows.append({'s': a, 't': b, 'w': x, 'r': y, 'k': topics[:3]})
        rows.append({'s': b, 't': a, 'w': y, 'r': x, 'k': topics[:3]})
    print(f'{len(rows)} rows', flush=True)
    # Optional third argument: row to start from (to resume an interrupted load)
    first = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    for start in range(first, len(rows), BATCH):
        chunk = json.dumps(rows[start:start + BATCH], ensure_ascii=False).replace('$', '')
        query(ref, token, f'''
            insert into public.meaning_topics (source_lang, target_lang, term, translation, topics, source)
            select s, t, w, r, k, 'dictionary'
            from jsonb_to_recordset($json${chunk}$json$::jsonb) as x(s text, t text, w text, r text, k text[])
            on conflict (source_lang, target_lang, term, translation) do update
              set topics = excluded.topics
              where meaning_topics.source = 'dictionary';
        ''')
        print(f'{min(start + BATCH, len(rows))}/{len(rows)}', flush=True)

if __name__ == '__main__':
    main()
