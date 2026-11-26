"""Bake document shards into page lists, preserving known file sizes."""
import argparse
import json
from pathlib import Path


def bake(root, sizes):
    if any(isinstance(value, bool) or not isinstance(value, int) or value < 0 for value in sizes.values()):
        raise ValueError('File sizes must be non-negative integer byte counts.')
    root = Path(root)
    documents = {}
    for shard in sorted((root / 'documents').glob('*.json')):
        rows = json.loads(shard.read_text())
        for record in rows.values():
            if record.get('pdfUrl') in sizes:
                record['sizeBytes'] = sizes[record['pdfUrl']]
        documents.update(rows)
        shard.write_text(json.dumps(rows, ensure_ascii=False) + '\n')
    count = 0
    for kind in ('legacy', 'resources', 'repositories'):
        for page in sorted((root / 'pages' / kind).rglob('*.json')):
            manifest = json.loads(page.read_text())
            ids = manifest.get('documentIds', [])
            missing = [key for key in ids if key not in documents]
            if missing:
                raise ValueError(f'Missing document IDs in {page}: {missing}')
            output = root / 'page-items' / kind / page.relative_to(root / 'pages' / kind)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_text(json.dumps([documents[key] for key in ids], ensure_ascii=False) + '\n')
            count += 1
    return count


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('sizes', type=Path)
    args = parser.parse_args()
    print(f'Baked {bake(args.root, json.loads(args.sizes.read_text()))} pages.')