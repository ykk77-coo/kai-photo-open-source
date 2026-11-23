"""Validate portable configuration, photo references and local assets. Standard library only."""
import argparse
import json
from pathlib import Path, PurePosixPath
import re
import stat
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
FEATURE_NAMES = {'map', 'secondAuthor', 'metadata', 'fieldNotes', 'frames', 'further'}
ASSIGNMENT_NAMES = {'site.config.js': 'PHOTO_SITE', 'photos.js': 'KAI_PHOTOS',
                    'china-map.js': 'KAI_PROVINCE_MAP'}
JS_SPACING = r'(?:\s|//[^\r\n]*|/\*[\s\S]*?\*/)*'
UNPUBLISHED = {'private', 'originals', 'tools', 'tests', 'docs', 'skills',
               'review', 'node_modules', '__pycache__', 'dist'}
PHOTO_SUFFIXES = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg', '.bmp', '.ico', '.tif', '.tiff'}

def assignment(path):
    text = path.read_text(encoding='utf-8-sig')
    name = ASSIGNMENT_NAMES.get(path.name, r'[A-Za-z_$][\w$]*')
    start = re.match(rf'{JS_SPACING}window\s*\.\s*{name}\s*={JS_SPACING}', text)
    if start is None:
        raise ValueError(f'{path.name}：需要 window.{name} = JSON 格式的赋值')
    try:
        value, end = json.JSONDecoder().raw_decode(text, start.end())
    except json.JSONDecodeError as error:
        raise ValueError(f'{path.name} 第 {error.lineno} 行第 {error.colno} 列：{error.msg}') from error
    tail = re.match(JS_SPACING, text[end:]).end() + end
    if tail < len(text) and (text[tail] != ';' or not re.fullmatch(JS_SPACING, text[tail + 1:])):
        raise ValueError(f'{path.name}：配置赋值后只能保留分号或注释')
    return value


def is_public_path(url):
    if not isinstance(url, str) or re.search(r'[\\:?#%<>"|*\x00-\x1f]', url):
        return False
    return all(part and not part.startswith('.') and part.rstrip(' .') == part
               and part.casefold() not in UNPUBLISHED and not part.casefold().startswith('dist-')
               for part in url.split('/'))


def local_file(root, url):
    relative = PurePosixPath(url) if isinstance(url, str) else None
    if relative is None or not is_public_path(relative.as_posix()):
        raise ValueError(f'文件必须使用站点内公开的相对路径：{url!r}')
    path = root
    try:
        for part in relative.parts:
            path = path / part
            info = path.lstat()
            is_reparse_point = getattr(info, 'st_file_attributes', 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT
            if stat.S_ISLNK(info.st_mode) or is_reparse_point:
                raise ValueError(f'文件路径不能经过符号链接或挂载点：{url}')
    except OSError as error:
        raise ValueError(f'文件不存在或无法读取：{url}') from error
    if not stat.S_ISREG(info.st_mode):
        raise ValueError(f'路径不是普通文件：{url}')
    return path


def public_photo_path(url):
    if not isinstance(url, str) or PurePosixPath(url).suffix.lower() not in PHOTO_SUFFIXES:
        raise ValueError(f'照片文件应使用可识别的图片扩展名：{url!r}')
    relative = PurePosixPath(url).as_posix()
    if not is_public_path(relative):
        raise ValueError(f'照片文件必须使用站点内公开的相对路径：{url!r}')
    return relative


def image_reference(images, key, field):
    if key in ('', None):
        return None
    if not isinstance(key, str) or key not in images:
        raise ValueError(f'{field} 引用的照片 image 键 {key!r} 不存在；请更新 site.config.js 或清空该封面')
    return images[key]


def validate(root=ROOT, *, warnings=None):
    config=assignment(root/'site.config.js');photos=assignment(root/'content/photos.js')
    if not isinstance(config, dict) or not isinstance(photos, list):
        raise ValueError('site.config.js 需要配置对象，content/photos.js 需要照片数组')
    warnings = [] if warnings is None else warnings
    assert set(config['authors'])=={'kai','friend'},'保留 kai/friend 两个作者键，显示名称可自由修改'
    for author, details in config['authors'].items():
        name = details.get('name') if isinstance(details, dict) else None
        if not isinstance(name, str) or not name.strip():
            raise ValueError(f'authors.{author}.name 需要填写显示名称')
    features = config.get('features', {})
    if not isinstance(features, dict):
        raise ValueError('features 需要使用对象配置功能开关')
    for key, value in features.items():
        if key not in FEATURE_NAMES:
            raise ValueError(f'features.{key} 不是支持的功能开关；可配置 {", ".join(sorted(FEATURE_NAMES))}')
        if not isinstance(value, bool):
            raise ValueError(f'features.{key} 必须为 true 或 false')
    assert len(config['categories'])==4,'首页需要四个分类：前三个主题与最后一个旅程入口'
    assert all(config['brand'].get(k) for k in ('name','title','subtitle','description','footer')),'品牌字段不完整'
    assert len({p['id'] for p in photos})==len(photos),'照片 ID 重复'
    assert len({p['image'] for p in photos})==len(photos),'图片键重复'
    ids={p['id']:p for p in photos};images={p['image']:p for p in photos}
    places = set()
    author_places = set()
    themes = {c.get('theme') for c in config['categories'][:3]}
    unlisted_themes = {}
    for p in photos:
        photo = f"content/photos.js 照片 {p['id']!r}"
        if p['author'] not in config['authors']:
            raise ValueError(f'{photo} 的 author {p["author"]!r} 不存在；使用 kai 或 friend')
        assert p['width']>0 and p['height']>0,'无效画幅'
        if not re.fullmatch(r'[0-9]{6}', str(p['provinceCode'])):
            raise ValueError(f'{photo} 的 provinceCode {p["provinceCode"]!r} 应为六位数字')
        assert isinstance(p['tags'],list) and p['tags'],'每张照片至少需要一个分组标签'
        if not isinstance(p['time'], str) or not re.fullmatch(r'pending|[0-9]{4}', p['time']):
            raise ValueError(f'{photo} 的 time {p["time"]!r} 应为四位年份字符串或 pending')
        assert not any(k in p for k in ('source','sha256','gps','latitude','longitude')),'公共目录不应包含原图路径或位置字段'
        if not isinstance(p['place'], str):
            raise ValueError(f'{photo} 的 place 应为文本')
        places.add(p['place'])
        author_places.add((p['author'], p['place']))
        if p.get('theme') and p['theme'] not in themes:
            unlisted_themes.setdefault(p['theme'], p['id'])
        for field in ('urls', 'webp'):
            for variant, url in p.get(field, {}).items():
                try:
                    local_file(root, public_photo_path(url))
                except ValueError as error:
                    raise ValueError(f'{photo} 的 {field}.{variant}：{error}') from error
        for variant in ('thumb','display','large'):
            if variant not in p['urls'] or p['renditionWidths'].get(variant, 0) <= 0:
                raise ValueError(f'{photo} 的 {variant} 副本缺少 urls 或有效的 renditionWidths')
    for theme, photo_id in unlisted_themes.items():
        warnings.append(f'照片 {photo_id!r} 使用主题 {theme!r}，首页前三个 categories[].theme 没有这个筛选项')
    for index, category in enumerate(config['categories']):
        for key in ('image', 'portrait'):
            field = f'categories[{index}].{key}'
            cover = image_reference(images, category.get(key), field)
            theme = category.get('theme')
            if cover and index < 3 and theme and cover.get('theme') != theme:
                warnings.append(f'{field} 的封面 {cover["image"]!r} 属于主题 {cover.get("theme")!r}，分类筛选使用 {theme!r}')
    for place, trip in config['journeys'].items():
        for key in ('cover','portrait'):
            field = f'journeys[{place!r}].{key}'
            cover = image_reference(images, trip.get(key), field)
            if cover and cover['place'] != place:
                raise ValueError(f'{field} 的封面 {cover["image"]!r} 实际属于地点 {cover["place"]!r}；请同步修改地点或封面')
        if photos and place not in places:
            warnings.append(f'journeys[{place!r}] 暂无对应照片；可保留草稿，改名时请同步 photos.js 的 place')
    image_reference(images, config['about'].get('portrait'), 'about.portrait')
    for index, section in enumerate(config['about']['sections']):
        image_reference(images, section.get('image'), f'about.sections[{index}].image')
    map_covers = config.get('map', {}).get('covers', {})
    if not isinstance(map_covers, dict):
        raise ValueError('map.covers 需要使用地区代码到照片 image 键的对象')
    if map_covers:
        regions = {str(region['code']) for region in assignment(root/'assets/china-map.js')['regions']}
        for region, key in map_covers.items():
            field = f'map.covers[{region!r}]'
            if region not in regions:
                raise ValueError(f'{field} 指定的地区未出现在 assets/china-map.js 中')
            cover = image_reference(images, key, field)
            if not cover or str(cover['provinceCode']) != region:
                actual = cover['provinceCode'] if cover else None
                raise ValueError(f'{field} 的封面 {key!r} 地区代码为 {actual!r}；请选择该地区的照片或删除这条配置')
    for e in config['essays']:
        assert e['photoIds'] and len(set(e['photoIds']))==len(e['photoIds']),'专题为空或存在重复照片'
        assert all(i in ids and ids[i]['author']==e['author'] for i in e['photoIds']),'专题引用不存在或属于其他作者的照片'
        assert e['coverPhotoId'] in e['photoIds'],'专题封面必须来自专题本身'
    for key,text in config.get('fieldNotes',{}).items():
        assert key in ids and isinstance(text,str),'手记必须引用存在的照片，且为纯文本'
    for author,links in config.get('further',{}).items():
        if author not in config['authors']:
            raise ValueError(f'further.{author} 指定的作者不存在；使用 kai 或 friend')
        for index, link in enumerate(links):
            field = f'further.{author}[{index}]'
            if link['place'] == link['next']:
                raise ValueError(f'{field} 的 place 和 next 均为 {link["place"]!r}；下一程不能指向自身')
            for key in ('place', 'next'):
                if (author, link[key]) not in author_places:
                    raise ValueError(f'{field}.{key} 为 {link[key]!r}，找不到作者 {author!r} 在该地点的照片；请同步地点改名')
            cover=ids.get(link['coverPhotoId'])
            if not cover or cover['author'] != author or cover['place'] != link['next']:
                actual = f'{cover["author"]!r} / {cover["place"]!r}' if cover else '未找到照片'
                raise ValueError(f'{field}.coverPhotoId 为 {link["coverPhotoId"]!r}（{actual}）；请选择 {author!r} 在 {link["next"]!r} 的照片 id')
    contact=config.get('contact',{})
    if contact.get('email'):assert re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+',contact['email']),'邮箱格式无效'
    if contact.get('socialUrl'):
        url=urlsplit(contact['socialUrl']);assert url.scheme=='https' and url.hostname and not url.username,'社交链接请使用完整 HTTPS 地址'
    for html in root.glob('*.html'):
        for url in re.findall(r'(?:src|href)="([^"#]+)"',html.read_text(encoding='utf-8')):
            if not url.startswith(('http:','https:')):
                relative=url.split('?')[0]
                local_file(root,relative+'index.html' if relative.endswith('/') else relative)
    for css in root.glob('*.css'):
        for url in re.findall(r'url\([\'\"]?([^\)\'\"]+)',css.read_text(encoding='utf-8')):
            local_file(root,url)
    return config,photos

if __name__=='__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='要检查的网站目录')
    args = parser.parse_args()
    warnings = []
    try:
        _, photos = validate(args.root.resolve(), warnings=warnings)
    except (ValueError, AssertionError, KeyError, TypeError, AttributeError, OSError) as error:
        raise SystemExit('配置检查失败：' + str(error)) from None
    for warning in warnings:
        print(f'WARN: {warning}')
    print(f'PASS: config, {len(photos)} photo records, essays and local dependencies')
