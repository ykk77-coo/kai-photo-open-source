"""Create readable HTML fallbacks and optional public share metadata at export."""
from hashlib import sha256
from html import escape
import json
import re
from urllib.parse import quote, urlencode, urljoin, urlsplit


PAGES = {
    "index.html": ("", ""),
    "works.html": ("作品", "浏览摄影作品"),
    "chapters.html": ("旅程", "按地点阅读摄影相册"),
    "series.html": ("相册", "浏览旅行相册和摄影专题"),
    "journey.html": ("地区索引", "从拍摄地区浏览相册"),
    "about.html": ("关于", "了解摄影者与作品集"),
}


def site_url(value):
    """Normalize the published URL prefix. Accept a subdirectory of a real site."""
    parts = urlsplit(value)
    if (parts.scheme != "https" or not parts.hostname or parts.username is not None
            or parts.query or parts.fragment or "\\" in value or any(c.isspace() for c in value)):
        raise ValueError("站点地址须为 HTTPS 目录，例如 https://example.com/photos/")
    return value.rstrip("/") + "/"


def attr(value):
    return escape(str(value), quote=True)


def relative_url(path):
    return quote(path, safe="/")


def href(url, label):
    return f'<a href="{attr(url)}">{escape(label)}</a>'


def list_links(links):
    return "<ul>" + "".join(f"<li>{href(url, label)}</li>" for url, label in links) + "</ul>" if links else ""


def image(photo, prefix="", lazy=False):
    path = prefix + relative_url(photo["urls"]["display"])
    label = photo.get("label") or photo.get("title") or "摄影作品"
    loading = ' loading="lazy"' if lazy else ""
    return (f'<img src="{attr(path)}" alt="{attr(label)}"{loading} '
            f'width="{attr(photo["width"])}" height="{attr(photo["height"])}">')


def visible_photos(config, photos):
    return [photo for photo in photos if photo["author"] != "friend" or config.get("features", {}).get("secondAuthor", True)]


def page_metadata(title, description, canonical=None, cover=None, kind="website"):
    values = [f'<meta name="description" content="{attr(description)}">']
    if canonical is None:
        return "\n".join(values)
    values.append(f'<link rel="canonical" href="{attr(canonical)}">')
    for name, value in (("title", title), ("description", description), ("url", canonical), ("type", kind)):
        values.append(f'<meta property="og:{name}" content="{attr(value)}">')
    if cover:
        values.append(f'<meta property="og:image" content="{attr(cover)}">')
    card = "summary_large_image" if cover else "summary"
    values.append(f'<meta name="twitter:card" content="{card}">')
    return "\n".join(values)


def share_image(base, photo):
    if photo:
        path = photo["urls"]["display"]
        if path.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            return urljoin(base, relative_url(path))
    return None


def photo_file(photo):
    unique = sha256(photo["id"].encode("utf-8")).hexdigest()[:24]
    return f"photo/p-{unique}.html"


def static_content(page, config, photos, shares):
    by_image = {photo["image"]: photo for photo in photos}
    primary = config["categories"][0].get("image")
    cover = by_image.get(primary) or (photos[0] if photos else None)
    brand = config["brand"]
    heading = PAGES[page][0] or brand["title"]
    intro = brand["description"] if page == "index.html" else PAGES[page][1]
    nav = [("index.html", "首页"), ("works.html", "作品"), ("chapters.html", "旅程"), ("about.html", "关于")]
    if config.get("features", {}).get("map", True):
        nav.insert(3, ("journey.html", "地区索引"))
    body = [
        '<article class="static-preview">',
        f"<h1>{escape(heading)}</h1>",
        f"<p>{escape(intro)}</p>",
    ]
    if page == "index.html":
        if cover:
            body.append(image(cover))
        links = [
            ("works.html?" + urlencode({"theme": category["theme"]}), category["name"])
            for category in config["categories"] if category.get("theme")
        ]
        body.append(list_links(links))
    elif page in {"works.html", "series.html"}:
        for photo in photos[:8]:
            link = shares.get(photo["id"], relative_url(photo["urls"]["large"]))
            body.append(f'<figure><a href="{attr(link)}">{image(photo, lazy=True)}</a>'
                        f'<figcaption>{escape(photo.get("title") or photo.get("label") or "摄影作品")}</figcaption></figure>')
        if not photos:
            body.append("<p>作品正在整理中。</p>")
    elif page in {"chapters.html", "journey.html"}:
        places = dict.fromkeys((photo["author"], photo["place"]) for photo in photos if photo.get("place"))
        links = [("series.html?" + urlencode({"author": author, "place": place}), place) for author, place in places]
        body.append(list_links(links) or "<p>相册正在整理中。</p>")
    elif page == "about.html":
        about = config["about"]
        body.append(f'<p>{escape(about.get("intro") or "")}</p>')
        portrait = by_image.get(about.get("portrait"))
        if portrait:
            body.append(image(portrait))
        for section in about.get("sections", []):
            body.append(f'<h2>{escape(section.get("title") or "")}</h2>')
            body.append(f'<p>{escape(section.get("text") or "")}</p>')
    body.append(list_links(nav))
    body.append("<noscript><p>开启 JavaScript 可使用筛选、完整相册和互动看图。</p></noscript>")
    if any(photo.get("sample") for photo in photos):
        body.append("<p>示例图形 · 非摄影作品</p>")
    if brand.get("footer"):
        body.append(f'<p>{escape(brand["footer"])}</p>')
    body.append("</article>")
    return "\n".join(body)


def render_page(source, page, config, photos, base, shares):
    brand = config["brand"]
    label, summary = PAGES[page]
    title = f'{label} · {brand["name"]}' if label else brand["title"]
    description = f'{summary} · {brand["description"]}' if summary else brand["description"]
    source = re.sub(r"<title>.*?</title>", lambda _: f"<title>{escape(title)}</title>", source, count=1)
    source = re.sub(r'<meta name="description" content="[^"]*">', "", source, count=1)
    if shares:
        source = source.replace('<script src="v2.js" defer>', '<script src="content/share-links.js" defer></script><script src="v2.js" defer>', 1)
    cover = next((url for photo in photos if (url := share_image(base, photo))), None) if base else None
    metadata = page_metadata(title, description, urljoin(base, page) if base else None, cover)
    source = source.replace("</head>", f"{metadata}\n</head>", 1)
    content = f'<main id="main">\n{static_content(page, config, photos, shares)}\n</main>'
    rendered, replaced = re.subn(r'<main id="main">.*?</main>', lambda _: content, source, count=1, flags=re.S)
    if replaced != 1:
        raise ValueError(f"{page} 缺少静态内容入口")
    return rendered


def write_public_pages(output, config, photos, base):
    shares = {photo["id"]: photo_file(photo) for photo in photos} if base else {}
    for page in PAGES:
        target = output / page
        source = target.read_text(encoding="utf-8")
        target.write_text(render_page(source, page, config, photos, base, shares), encoding="utf-8")
    if not base:
        return
    if shares:
        (output / "content/share-links.js").write_text(
            f"window.KAI_SHARE_LINKS = new Map({json.dumps(list(shares.items()), ensure_ascii=True)});\n",
            encoding="utf-8",
        )
        (output / "photo").mkdir()
    for photo in photos:
        relative = shares[photo["id"]]
        title = photo.get("title") or photo.get("label") or "摄影作品"
        description = config["brand"]["description"]
        public_title = f'{title} · {config["brand"]["name"]}'
        interactive = "../works.html?" + urlencode({"author": photo["author"], "photo": photo["id"]})
        author = config["authors"][photo["author"]]["name"]
        caption = escape(author)
        detail = image(photo, "../")
        metadata = page_metadata(public_title, description, urljoin(base, relative), share_image(base, photo), "article")
        (output / relative).write_text(
            '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{escape(public_title)}</title>\n{metadata}\n'
            '<link rel="icon" href="../favicon.svg"><link rel="stylesheet" href="../assets/static-preview.css">'
            '</head><body class="static-photo-page"><main class="static-preview">'
            f'<h1>{escape(title)}</h1><figure>{detail}<figcaption>{caption}</figcaption></figure>'
            f'<p>{href(interactive, "打开看图器")} · {href("../works.html", "浏览全部作品")}</p></main></body></html>\n',
            encoding="utf-8",
        )
    pages = [page for page in PAGES if page != "journey.html" or config.get("features", {}).get("map", True)]
    addresses = "".join(f"<url><loc>{escape(urljoin(base, path))}</loc></url>\n" for path in [*pages, *shares.values()])
    (output / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + addresses + "</urlset>\n", encoding="utf-8",
    )
    if urlsplit(base).path == "/":
        (output / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {urljoin(base, 'sitemap.xml')}\n", encoding="utf-8")
