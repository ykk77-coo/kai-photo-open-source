"""Exercise the photo importer with disposable, synthetic images."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image, features


ROOT = Path(__file__).resolve().parents[1]


class ImportTest(unittest.TestCase):
    def setUp(self):
        scratch = ROOT / 'private'
        scratch.mkdir(exist_ok=True)
        temp = tempfile.TemporaryDirectory(dir=scratch)
        self.addCleanup(temp.cleanup)
        base = Path(temp.name)
        self.source = base / 'originals'
        self.source.mkdir()
        self.output = base / 'site'
        self.catalog = self.output / 'content/photos.js'

    def photo(self, name, color='red'):
        path = self.source / name
        Image.new('RGB', (16, 12), color).save(path)
        return path

    def run_import(self, *flags, success=True):
        result = subprocess.run(
            [sys.executable, str(ROOT / 'tools/import_photos.py'),
             '--input', str(self.source), '--output-root', str(self.output),
             '--place', '测试', '--province-code', '510000', *flags],
            capture_output=True, text=True, encoding='utf-8',
            env={**os.environ, 'PYTHONIOENCODING': 'utf-8'},
        )
        self.assertEqual(result.returncode == 0, success, result.stderr)
        return result

    def records(self):
        content = self.catalog.read_text(encoding='utf-8')
        return json.loads(content.split('=', 1)[1].strip().removesuffix(';'))

    def snapshot(self):
        return {
            path.relative_to(self.output): (path.read_bytes(), path.stat().st_mtime_ns)
            for path in self.output.rglob('*') if path.is_file()
        }

    def test_default_public_fields_hide_original_filename(self):
        original = self.photo('SENSITIVE-MEMBER-104.jpg')
        raw = original.read_bytes()
        result = self.run_import()
        self.assertNotIn('SENSITIVE-MEMBER-104', result.stdout)
        self.assertNotIn('SENSITIVE-MEMBER-104', self.catalog.read_text(encoding='utf-8'))
        record, = self.records()
        self.assertNotIn('filename', record)
        self.assertTrue(record['title'])
        self.assertEqual(original.read_bytes(), raw)

    def test_default_append_deduplicates_and_preserves_existing_edits(self):
        original = self.photo('SENSITIVE-MEMBER-104.jpg')
        self.run_import()
        record, = self.records()
        record['filename'] = original.name
        record['title'] = '手工标题'
        record['place'] = '修订地点'
        record['label'] = '测试 · SENSITIVE-MEMBER-104'
        record['metadata'] = {'camera': '手工修订'}
        self.catalog.write_text(
            f'window.KAI_PHOTOS = {json.dumps([record], ensure_ascii=False)};\n',
            encoding='utf-8',
        )
        original.rename(self.source / 'RENAMED.JPG')
        self.photo('other.JPG', color='blue')
        self.run_import()
        saved, new = self.records()
        self.assertEqual(saved['id'], record['id'])
        self.assertEqual(saved['title'], '手工标题')
        self.assertEqual(saved['place'], '修订地点')
        self.assertEqual(saved['metadata'], {'camera': '手工修订'})
        self.assertNotIn('SENSITIVE-MEMBER-104', self.catalog.read_text(encoding='utf-8'))
        before = self.snapshot()
        self.run_import('--append')
        self.assertEqual(self.snapshot(), before)
        self.assertNotEqual(new['id'], saved['id'])

    def test_replace_requires_confirmation_and_preserves_asset_files(self):
        original = self.photo('first.jpg')
        self.run_import()
        first, = self.records()
        original.unlink()
        self.photo('second.jpg', color='blue')
        before = self.snapshot()
        result = self.run_import('--replace', success=False)
        self.assertIn('--yes', result.stderr)
        self.assertEqual(self.snapshot(), before)
        self.run_import('--replace', '--yes')
        second, = self.records()
        self.assertNotEqual(first['id'], second['id'])
        for url in first['urls'].values():
            self.assertEqual((self.output / url).read_bytes(), before[Path(url)][0])

    def test_dry_run_writes_nothing_including_to_nonexistent_output(self):
        self.photo('SENSITIVE-MEMBER-104.jpg')
        result = self.run_import('--dry-run')
        self.assertNotIn('SENSITIVE-MEMBER-104', result.stdout)
        self.assertFalse(self.output.exists())
        self.run_import()
        self.photo('second.jpg', color='blue')
        before = self.snapshot()
        self.run_import('--dry-run', '--replace')
        self.assertEqual(self.snapshot(), before)

    def test_heic_only_gives_conversion_hint_without_writing(self):
        (self.source / 'SENSITIVE-MEMBER-104.HEIC').write_bytes(b'not a JPEG')
        result = self.run_import(success=False)
        self.assertIn('HEIC', result.stderr)
        self.assertIn('离线', result.stderr)
        self.assertNotIn('SENSITIVE-MEMBER-104', result.stderr)
        self.assertFalse(self.output.exists())

    def test_png_and_webp_are_imported_as_web_copies(self):
        self.photo('one.PNG')
        if features.check('webp'):
            self.photo('two.WEBP', color='blue')
        self.run_import()
        self.assertEqual(len(self.records()), 2 if features.check('webp') else 1)
        for record in self.records():
            with Image.open(self.output / record['urls']['display']) as image:
                self.assertEqual(image.format, 'JPEG')

    def test_transparent_png_does_not_show_hidden_rgb_in_web_copy(self):
        Image.new('RGBA', (16, 12), (255, 0, 0, 0)).save(self.source / 'transparent.png')
        self.run_import()
        record, = self.records()
        with Image.open(self.output / record['urls']['display']) as image:
            self.assertEqual(image.getpixel((8, 6)), (255, 255, 255))

    def test_failed_batch_preserves_catalog_and_existing_assets(self):
        self.photo('first.jpg')
        self.run_import()
        before = self.snapshot()
        self.photo('new.jpg', color='blue')
        (self.source / 'secret-invalid.jpg').write_bytes(b'damaged image')
        failure = self.run_import('--replace', '--yes', success=False)
        self.assertIn('无法处理', failure.stderr)
        self.assertNotIn('secret-invalid', failure.stderr)
        self.assertEqual(self.snapshot(), before)

    def test_cannot_import_files_from_the_generated_upload_directory(self):
        self.photo('first.jpg')
        self.run_import()
        self.source = self.output / 'assets/uploads'
        before = self.snapshot()
        self.run_import(success=False)
        self.assertEqual(self.snapshot(), before)


if __name__ == '__main__':
    unittest.main()
