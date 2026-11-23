"""Regression checks for readable static output and stable public share pages."""
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


class SiteExportTest(unittest.TestCase):
    def build(self, fixture, *args):
        command = [sys.executable, "-B", "tools/build.py", "--output", "dist-test", *args]
        return subprocess.run(command, cwd=fixture, check=True, capture_output=True)

    def test_default_export_contains_readable_photos_without_public_domain(self):
        with tempfile.TemporaryDirectory() as tmp:
            fixture = Path(tmp) / "site"
            shutil.copytree(ROOT, fixture, ignore=shutil.ignore_patterns(".git", "node_modules", "dist*", "private", "__pycache__"))
            self.build(fixture)
            target = fixture / "dist-test"
            home = (target / "index.html").read_text(encoding="utf-8")
            works = (target / "works.html").read_text(encoding="utf-8")
            self.assertIn('<link rel="icon" href="favicon.svg"', home)
            self.assertTrue((target / "favicon.svg").is_file())
            self.assertRegex(home, r'<main id="main">\s*<article class="static-preview"')
            self.assertIn("assets/demo/", home)
            self.assertIn("assets/demo/", works)
            self.assertNotIn('rel="canonical"', home)
            self.assertNotIn("og:url", home)
            self.assertFalse((target / "sitemap.xml").exists())

    def test_deployed_subpath_and_individual_photo_share(self):
        with tempfile.TemporaryDirectory() as tmp:
            fixture = Path(tmp) / "site"
            shutil.copytree(ROOT, fixture, ignore=shutil.ignore_patterns(".git", "node_modules", "dist*", "private", "__pycache__"))
            catalog = fixture / "content/photos.js"
            photos = json.loads(catalog.read_text(encoding="utf-8").split("=", 1)[1].strip().removesuffix(";"))
            photo = photos[0]
            photo.update(title='街灯 & <雨>', sample=False)
            photo["urls"]["display"] = "assets/share-image.jpg"
            Image.new("RGB", (640, 480), (45, 60, 72)).save(fixture / photo["urls"]["display"])
            catalog.write_text("window.KAI_PHOTOS = " + json.dumps(photos, ensure_ascii=False) + ";", encoding="utf-8")
            base = "https://example.test/gallery/"
            self.build(fixture, "--site-url", base)
            target = fixture / "dist-test"
            self.assertIn('href="' + base + 'works.html"', (target / "works.html").read_text(encoding="utf-8"))
            mapping = (target / "content/share-links.js").read_text(encoding="utf-8")
            relative = re.search(r'"' + re.escape(photo["id"]) + r'"\s*,\s*"(photo/[^"]+)"', mapping)[1]
            landing = (target / relative).read_text(encoding="utf-8")
            self.assertIn('property="og:image" content="' + base + 'assets/share-image.jpg"', landing)
            self.assertIn('property="og:url" content="' + base + relative + '"', landing)
            self.assertIn("街灯 &amp; &lt;雨&gt;", landing)
            self.assertIn('../works.html?author=kai&amp;photo=', landing)
            self.assertIn("../assets/share-image.jpg", landing)
            self.assertIn(base + relative, (target / "sitemap.xml").read_text(encoding="utf-8"))
            self.assertFalse((target / "robots.txt").exists())
