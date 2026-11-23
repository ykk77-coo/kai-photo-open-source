"""Verify a customized Lumen site's config, disposable export and static links."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit

from check import ROOT, validate
from static_pages import PAGES


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.anchors = set()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if attributes.get("id"):
            self.anchors.add(attributes["id"])
        for name in ("src", "href"):
            if attributes.get(name):
                self.references.append(attributes[name])


def exported_links(output):
    pages = {}
    for path in sorted(output.rglob("*.html")):
        links = Links()
        links.feed(path.read_text(encoding="utf-8"))
        pages[path] = links
    count = 0
    failures = []
    for page, links in pages.items():
        for url in links.references:
            parts = urlsplit(url)
            if parts.scheme or parts.netloc:
                continue
            target = (page.parent / unquote(parts.path)).resolve() if parts.path else page
            if target.is_dir():
                target /= "index.html"
            if not target.is_relative_to(output) or not target.is_file():
                failures.append(f"{page.relative_to(output)} → {url}")
            elif parts.fragment and target in pages and unquote(parts.fragment) not in pages[target].anchors:
                failures.append(f"{page.relative_to(output)} → {url}（缺少锚点）")
            count += 1
    return count, failures


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site-url", help="同时核对指定公开地址对应的分享页导出")
    args = parser.parse_args()
    warnings = []
    try:
        _, photos = validate(warnings=warnings)
    except (ValueError, AssertionError, KeyError, OSError, TypeError) as error:
        print(f"[FAIL] 配置与照片引用 — {error}")
        return 1
    print(f"[PASS] 配置与照片引用 — {len(photos)} 张作品")
    for warning in warnings:
        print(f"[NOTE] {warning}")
    with tempfile.TemporaryDirectory(prefix="dist-verify-", dir=ROOT) as temporary:
        output = Path(temporary) / "site"
        command = [sys.executable, "-B", str(ROOT / "tools/build.py"), "--output", str(output)]
        if args.site_url:
            command += ["--site-url", args.site_url]
        built = subprocess.run(command, cwd=ROOT, capture_output=True, encoding="utf-8", errors="replace")
        if built.returncode:
            print("[FAIL] 静态导出 — " + (built.stderr or built.stdout).strip())
            return 1
        print(f"[PASS] 静态导出 — {sum(p.is_file() for p in output.rglob('*'))} 个文件")
        count, failures = exported_links(output)
        if failures:
            print("[FAIL] 导出页面的本地链接")
            print("\n".join(failures))
            return 1
        print(f"[PASS] 导出页面的本地链接 — {count} 个")
        for page in PAGES:
            if '<article class="static-preview">' not in (output / page).read_text(encoding="utf-8"):
                print(f"[FAIL] 静态内容 — {page} 缺少直接可读的内容")
                return 1
        print("[PASS] 静态内容 — 6 个页面")
    print("在浏览器中再检查桌面和手机的布局、导航与看图操作。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
