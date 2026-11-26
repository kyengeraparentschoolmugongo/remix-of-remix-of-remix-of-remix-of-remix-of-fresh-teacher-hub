import importlib.util
import hashlib
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('merge_artwork', Path(__file__).resolve().parents[2] / 'scripts/merge_movie_artwork.py')
merge_artwork = importlib.util.module_from_spec(spec)
spec.loader.exec_module(merge_artwork)


class MovieArtworkMergeTests(unittest.TestCase):
    def test_all_1099_original_streams_keep_their_order_and_identity(self):
        catalog = json.loads((Path(__file__).resolve().parents[1] / 'data/luganda-movies.json').read_text())
        original = [{key: row[key] for key in ('title', 'year', 'vj', 'href')} for row in catalog[:1099]]
        self.assertEqual(len(catalog), 1104)
        self.assertEqual(hashlib.sha256(json.dumps(original, sort_keys=True, separators=(',', ':')).encode()).hexdigest(), '00d0aa612fee72b3d5fd1d578c6d7af0b0e7bad9aa18d3cb24e02c639aa54b94')

    def test_duplicate_streams_choose_the_matching_title_and_year(self):
        entry = {'title': 'Scream VI', 'year': 2023, 'href': 'https://stream/film', 'vj': 'VJ Junior'}
        source = [dict(entry, title='Other Film', thumbnail='wrong-art'), dict(entry, title='Scream VI by Vj Junior', thumbnail='right-art')]
        self.assertEqual(merge_artwork.merge([entry], source)[0]['thumbnail'], 'right-art')

    def test_stream_url_wins_over_title_and_preserves_identity(self):
        entry = {'title': 'Film', 'year': 2001, 'href': 'https://stream/film', 'vj': 'VJ Emmy'}
        source = [dict(entry, thumbnail='stream-art'), dict(entry, href='wiki', thumbnail='title-art')]
        result = merge_artwork.merge([entry], source)
        self.assertEqual(result, [dict(entry, thumbnail='stream-art')])
        self.assertNotIn('thumbnail', entry)

    def test_title_fallback_requires_same_year_and_unambiguous_artwork(self):
        entries = [{'title': 'Film', 'year': year, 'href': str(year), 'vj': 'VJ Emmy'} for year in (2001, 2010)]
        source = [{'title': 'Film', 'year': 2001, 'href': 'wiki', 'thumbnail': 'art'}]
        result = merge_artwork.merge(entries, source)
        self.assertEqual(result[0]['thumbnail'], 'art')
        self.assertNotIn('thumbnail', result[1])
        source.append(dict(source[0], thumbnail='different-art'))
        self.assertNotIn('thumbnail', merge_artwork.merge(entries, source)[0])

    def test_luo_stream_is_appended_once_and_merge_is_idempotent(self):
        source = [{'title': 'Rat Race Luo Translated', 'year': 2001, 'href': 'https://mobifliks.info/downloadmp4.php?file=luo/Rats.mp4', 'thumbnail': 'art'}]
        result = merge_artwork.merge([], source)
        self.assertEqual(result[0]['vj'], 'Luo Translated')
        self.assertEqual(result[0]['thumbnail'], 'art')
        self.assertEqual(merge_artwork.merge(result, source), result)