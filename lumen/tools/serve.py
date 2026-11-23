"""Run a localhost-only preview. No authentication, uploads or public exposure."""
import argparse
from functools import lru_cache, partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from urllib.parse import unquote

from build import public_source_files
from check import ROOT, assignment, is_public_path, local_file, public_photo_path

APP_FILES = {path.as_posix() for path in public_source_files([])}
EXAMPLE_FILES = {
    'examples/demo.css',
    'examples/record-deck/index.html',
    'examples/record-deck/perspective.js',
    'examples/persistent-audio/index.html',
    'examples/persistent-audio/lumen-tone.wav',
    'assets/demo/demo-01.svg',
    'assets/demo/demo-02.svg',
    'assets/demo/demo-05.svg',
}
EXAMPLE_DIRECTORIES = {'examples/record-deck', 'examples/persistent-audio'}
GENERATED_FILES = {'content/share-links.js', 'sitemap.xml', 'robots.txt'}


@lru_cache(maxsize=4)
def published_photos(root, _modified, _size):
    """Refresh the asset allowlist when the catalog changes on disk."""
    try:
        photos = assignment(root / 'content/photos.js')
    except (OSError, ValueError):
        return set()
    urls = set()
    if isinstance(photos, list):
        for photo in photos:
            if not isinstance(photo, dict):
                continue
            for field in ('urls', 'webp'):
                variants = photo.get(field, {})
                if isinstance(variants, dict):
                    for url in variants.values():
                        try:
                            urls.add(public_photo_path(url))
                        except ValueError:
                            continue
    return urls


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory, built):
        self.root = directory
        self.built = built
        super().__init__(*args, directory=directory)

    def is_served(self, relative):
        if relative in APP_FILES:
            return True
        if self.built:
            if relative in GENERATED_FILES or re.fullmatch(r'photo/p-[0-9a-f]{24}\.html', relative):
                return True
        elif relative in EXAMPLE_FILES:
            return True
        try:
            info = local_file(self.root, 'content/photos.js').stat()
        except (OSError, ValueError):
            return False
        return relative in published_photos(self.root, info.st_mtime_ns, info.st_size)

    def send_head(self):
        try:
            pathname = unquote(self.path.split('?', 1)[0], errors='strict')
            if pathname == '/':
                relative = 'index.html'
            elif not self.built and pathname[1:].removesuffix('/') in EXAMPLE_DIRECTORIES:
                relative = pathname[1:].removesuffix('/') + '/index.html'
            else:
                relative = pathname[1:]
            if not pathname.startswith('/') or not is_public_path(relative) or not self.is_served(relative):
                raise ValueError('path is outside the public preview')
            local_file(self.root, relative)
        except (UnicodeError, ValueError):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--directory', type=Path, help='preview a generated static site directory')
    args = parser.parse_args()
    root = args.directory.resolve() if args.directory else ROOT
    try:
        local_file(root, 'index.html')
    except ValueError as error:
        parser.error(str(error))
    handler = partial(PreviewHandler, directory=root, built=args.directory is not None)
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'Preview http://127.0.0.1:{server.server_port}/index.html', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    main()
