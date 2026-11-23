"""Content and loopback preview regressions for the template tools."""
import http.client
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from check import assignment, validate


def write_assignment(path, name, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f'window.{name} = {json.dumps(value, ensure_ascii=False)};\n', encoding='utf-8')


class ConfigTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        self.config_path = self.root / 'site.config.js'
        self.photo_path = self.root / 'content/photos.js'
        self.config = {
            'authors': {'kai': {'name': '摄影者'}, 'friend': {'name': '同行者'}},
            'categories': [{'name': '山野', 'theme': '山野', 'image': 'image-a'},
                           {'name': '城市', 'theme': '城市'},
                           {'name': '日常', 'theme': '日常'}, {'name': '沿途', 'theme': ''}],
            'brand': {key: 'Test' for key in ('name', 'title', 'subtitle', 'description', 'footer')},
            'journeys': {'山间': {'cover': 'image-a'}, '城中': {'cover': 'image-b'}},
            'about': {'sections': []}, 'essays': [], 'features': {'map': True},
            'map': {'covers': {'510000': 'image-a'}},
            'further': {'kai': [{'place': '山间', 'next': '城中', 'coverPhotoId': 'photo-b'}]},
        }
        variants = ('thumb', 'display', 'large')
        self.photos = []
        for key, place, theme, code in [('a', '山间', '山野', '510000'), ('b', '城中', '城市', '310000')]:
            url = f'assets/photo-{key}.svg'
            image = self.root / url
            image.parent.mkdir(exist_ok=True)
            image.write_text('<svg/>', encoding='utf-8')
            self.photos.append({
                'id': f'photo-{key}', 'image': f'image-{key}', 'author': 'kai', 'place': place,
                'provinceCode': code, 'theme': theme, 'width': 100, 'height': 100, 'time': 'pending',
                'tags': ['test'], 'urls': dict.fromkeys(variants, url),
                'renditionWidths': dict.fromkeys(variants, 100),
            })
        write_assignment(self.root / 'assets/china-map.js', 'KAI_PROVINCE_MAP',
                         {'regions': [{'code': '510000'}, {'code': '310000'}]})

    def check(self, **kwargs):
        write_assignment(self.config_path, 'PHOTO_SITE', self.config)
        write_assignment(self.photo_path, 'KAI_PHOTOS', self.photos)
        return validate(self.root, **kwargs)

    def test_comments_can_contain_equals_and_strings_keep_escapes(self):
        self.config_path.write_text('\ufeff// comment = not assignment\n/* window.TEST = ignored */\n'
                                    r'window.PHOTO_SITE = {"title":"a=b and \"quoted\""};'
                                    '\n// tail comment = ignored\n', encoding='utf-8')
        self.assertEqual(assignment(self.config_path), {'title': 'a=b and "quoted"'})

    def test_unknown_feature_is_actionable(self):
        self.config['features']['analytics'] = True
        with self.assertRaisesRegex(ValueError, r'features\.analytics'):
            self.check()

    def test_whitespace_only_author_name_is_rejected(self):
        self.config['authors']['friend']['name'] = '  \t '
        with self.assertRaisesRegex(ValueError, r'authors\.friend\.name'):
            self.check()

    def test_map_cover_must_exist_in_the_corresponding_region(self):
        for cover in ('missing-image', 'image-b'):
            self.config['map']['covers']['510000'] = cover
            with self.subTest(cover=cover), self.assertRaisesRegex(ValueError, f'510000.*{cover}'):
                self.check()

    def test_place_rename_identifies_reference_and_actual_place(self):
        self.photos[0]['place'] = '山里'
        with self.assertRaisesRegex(ValueError, r'journeys.*山间.*image-a.*山里'):
            self.check()

    def test_further_reference_identifies_missing_origin(self):
        self.config['further']['kai'][0]['place'] = '旧地名'
        with self.assertRaisesRegex(ValueError, r'further\.kai\[0\]\.place.*旧地名'):
            self.check()

    def test_empty_site_allows_draft_journey_and_categories(self):
        self.photos.clear()
        self.config['journeys'] = {'未整理旅程': {'intro': '待补', 'cover': ''}}
        self.config['map']['covers'] = {}
        self.config['further'] = {}
        self.config['categories'][0]['image'] = ''
        warnings = []
        self.assertEqual(self.check(warnings=warnings)[1], [])
        self.assertEqual(warnings, [])

    def test_cover_theme_mismatch_and_unused_journey_are_reported(self):
        self.config['categories'][0]['image'] = 'image-b'
        self.config['journeys']['未整理旅程'] = {'intro': '待补'}
        warnings = []
        self.check(warnings=warnings)
        self.assertTrue(any('categories[0].image' in message and 'image-b' in message for message in warnings))
        self.assertTrue(any('journeys' in message and '未整理旅程' in message for message in warnings))

    def test_photo_urls_cannot_publish_private_files(self):
        hidden = self.root / 'private/picture.svg'
        hidden.parent.mkdir()
        hidden.write_text('<svg/>', encoding='utf-8')
        self.photos[0]['urls']['display'] = 'private/picture.svg'
        with self.assertRaisesRegex(ValueError, r'photo-a.*urls\.display.*private/picture.svg'):
            self.check()


@contextmanager
def preview(directory=None):
    command = [sys.executable, str(ROOT / 'tools/serve.py'), '--port', '0']
    if directory is not None:
        command.extend(['--directory', str(directory)])
    with subprocess.Popen(command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                          text=True, encoding='utf-8') as server:
        try:
            first_line = server.stdout.readline()
            address = re.search(r'127\.0\.0\.1:(\d+)', first_line)
            if address is None or not int(address[1]):
                raise AssertionError(f'preview did not report its bound port: {first_line!r}')
            yield int(address[1])
        finally:
            server.terminate()
            server.wait(timeout=5)


def request(port, path, method='GET'):
    client = http.client.HTTPConnection('127.0.0.1', port, timeout=5)
    try:
        client.request(method, path)
        with client.getresponse() as response:
            return response.status, response.getheader('Cache-Control'), response.read()
    finally:
        client.close()


class PreviewTest(unittest.TestCase):
    def test_source_serves_app_and_exact_examples_without_listing(self):
        with preview() as port:
            for path in ('/', '/index.html', '/works.html?author=kai', '/content/photos.js',
                         '/examples/demo.css', '/examples/record-deck/', '/examples/record-deck/perspective.js',
                         '/examples/persistent-audio/', '/examples/persistent-audio/lumen-tone.wav',
                         '/assets/demo/demo-01.svg', '/assets/demo/demo-05.svg'):
                with self.subTest(path=path):
                    status, caching, body = request(port, path)
                    self.assertEqual(status, 200)
                    self.assertEqual(caching, 'no-store')
                    self.assertTrue(body)
            for path in ('/private/', '/tests/flows.cjs', '/tools/check.py', '/.git', '/package.json',
                         '/assets/', '/examples/', '/content/', '/assets/demo/', '/dist-ai-guide-check/',
                         '/examples/../tools/check.py'):
                with self.subTest(path=path):
                    self.assertEqual(request(port, path, 'HEAD')[0], 404)

    def test_explicit_directory_serves_generated_pages_and_only_public_files(self):
        root = Path(self.enterContext(tempfile.TemporaryDirectory()))
        share = 'photo/p-' + '1' * 24 + '.html'
        for name in ('index.html', 'robots.txt', 'sitemap.xml', 'content/share-links.js', share,
                     'notes.html', 'assets/originals/original.svg', 'assets/photo.svg', 'photo/unpublished.html'):
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(name, encoding='utf-8')
        write_assignment(root / 'content/photos.js', 'KAI_PHOTOS',
                         [{'urls': {'display': 'assets/originals/original.svg', 'thumb': './assets/photo.svg'}}])
        with preview(root) as port:
            for name in ('index.html', 'robots.txt', 'sitemap.xml', 'content/share-links.js', share, 'assets/photo.svg'):
                self.assertEqual(request(port, '/' + name)[0], 200, name)
            for name in ('notes.html', 'assets/originals/original.svg', 'photo/unpublished.html', 'photo/'):
                self.assertEqual(request(port, '/' + name)[0], 404, name)

    def test_public_paths_do_not_follow_symbolic_links(self):
        base = Path(self.enterContext(tempfile.TemporaryDirectory()))
        root = base / 'site'
        root.mkdir()
        (root / 'index.html').write_text('Preview', encoding='utf-8')
        target = base / 'outside'
        target.mkdir()
        (target / 'china-map.js').write_text('Outside preview', encoding='utf-8')
        if os.name == 'nt':
            link = subprocess.run(['cmd', '/c', 'mklink', '/J', str(root / 'assets'), str(target)],
                                  capture_output=True)
            if link.returncode:
                self.skipTest('cannot create a Windows directory junction')
        else:
            (root / 'assets').symlink_to(target, target_is_directory=True)
        with preview(root) as port:
            self.assertEqual(request(port, '/assets/china-map.js')[0], 404)


if __name__ == '__main__':
    unittest.main()
