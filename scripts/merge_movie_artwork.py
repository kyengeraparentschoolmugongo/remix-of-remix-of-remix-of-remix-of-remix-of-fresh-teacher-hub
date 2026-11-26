"""Enrich catalog artwork without reordering or replacing existing streams."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit, parse_qs


def title_key(title):
    title = re.sub(r'\s+(luo translated|translated in luo|luganda translated)$', '', title, flags=re.I)
    title = re.sub(r'\s+(?:by\s+(?:vj\s+)?|vj\s+)(?:ice\s*p|junior|emmy|kevo|muba|jingo|kevin|mark|lance|ulio)\b.*$', '', title, flags=re.I)
    return re.sub(r'[^a-z0-9]+', ' ', title.lower().replace('&', ' and ')).strip()


def merge(catalog, source):
    by_url = {}
    by_title = {}
    for row in source:
        if not row.get('thumbnail'):
            continue
        by_url.setdefault(row.get('href'), []).append(row)
        by_title.setdefault((title_key(row['title']), row['year']), []).append(row)
    result = [dict(row) for row in catalog]
    for row in result:
        matches = by_url.get(row['href']) or by_title.get((title_key(row['title']), row['year']), [])
        exact = [match for match in matches if (title_key(match['title']), match['year']) == (title_key(row['title']), row['year'])]
        if exact and row['href'] in by_url:
            matches = exact[:1]
        thumbnails = {match['thumbnail'] for match in matches}
        if not row.get('thumbnail') and len(thumbnails) == 1:
            row['thumbnail'] = thumbnails.pop()
    streams = {row['href'] for row in result}
    for row in source:
        href = row.get('href', '')
        parsed = urlsplit(href)
        file = parse_qs(parsed.query).get('file', [''])[0]
        if parsed.scheme not in ('http', 'https') or not unquote(file).lower().startswith('luo/') or href in streams:
            continue
        entry = {key: row[key] for key in ('title', 'year', 'href')}
        entry['vj'] = 'Luo Translated'
        if row.get('thumbnail'):
            entry['thumbnail'] = row['thumbnail']
        result.append(entry)
        streams.add(href)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('catalog', type=Path)
    args = parser.parse_args()
    catalog = json.loads(args.catalog.read_text())
    result = merge(catalog, json.loads(args.source.read_text()))
    args.catalog.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{len(result)} streams; {sum(bool(row.get("thumbnail")) for row in result)} thumbnails; {len(result) - len(catalog)} appended.')