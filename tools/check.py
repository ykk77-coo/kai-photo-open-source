"""Validate portable configuration, photo references and local assets. Standard library only."""
import json
from pathlib import Path,PurePosixPath
import re

ROOT=Path(__file__).resolve().parents[1]

def assignment(path):
    return json.loads(path.read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))

def local_file(root,url):
    if not isinstance(url,str) or not url or any(c in url for c in ('\\',':','?','#')) or url.startswith('/') or '..' in PurePosixPath(url).parts:
        raise ValueError(f'媒体必须使用站点内相对路径：{url!r}')
    p=(root/url).resolve()
    if not p.is_relative_to(root.resolve()) or not p.is_file():raise ValueError(f'文件不存在：{url}')
    return p

def validate(root=ROOT):
    config=assignment(root/'site.config.js');photos=assignment(root/'content/photos.js')
    assert set(config['authors'])=={'kai','friend'},'保留 kai/friend 两个作者键，显示名称可自由修改'
    assert len(config['categories'])==4,'首页需要四个分类：前三个主题与最后一个旅程入口'
    assert all(config['brand'].get(k) for k in ('name','title','subtitle','description','footer')),'品牌字段不完整'
    assert len({p['id'] for p in photos})==len(photos),'照片 ID 重复'
    assert len({p['image'] for p in photos})==len(photos),'图片键重复'
    ids={p['id']:p for p in photos};images={p['image'] for p in photos}
    for p in photos:
        assert p['author'] in config['authors'],'未知摄影者'
        assert p['width']>0 and p['height']>0,'无效画幅'
        assert re.fullmatch(r'\d{6}',str(p['provinceCode'])),'省级代码无效'
        assert isinstance(p['tags'],list) and p['tags'],'每张照片至少需要一个分组标签'
        assert p['time']=='pending' or re.fullmatch(r'\d{4}',p['time']),'日期年份无效'
        assert not any(k in p for k in ('source','sha256','gps','latitude','longitude')),'公共目录不应包含原图路径或位置字段'
        for variant in ('thumb','display','large'):
            local_file(root,p['urls'][variant]);assert p['renditionWidths'][variant]>0
    for p in photos:
        for alternate in p.get('webp',{}).values():local_file(root,alternate)
    for c in config['categories']:
        assert not c.get('image') or c['image'] in images,'首页封面 ID 不存在；请更新 site.config.js'
    for trip in config['journeys'].values():
        for key in ('cover','portrait'):
            assert not trip.get(key) or trip[key] in images,'旅程封面 ID 不存在'
    for key in [config['about'].get('portrait')]+[s.get('image') for s in config['about']['sections']]:
        assert not key or key in images,'关于页图片 ID 不存在'
    for e in config['essays']:
        assert e['photoIds'] and len(set(e['photoIds']))==len(e['photoIds']),'专题为空或存在重复照片'
        assert all(i in ids and ids[i]['author']==e['author'] for i in e['photoIds']),'专题引用不存在或属于其他作者的照片'
        assert e['coverPhotoId'] in e['photoIds'],'专题封面必须来自专题本身'
    features=config.get('features',{})
    assert all(isinstance(v,bool) for v in features.values()),'功能选项必须为 true/false'
    for category in config['categories']:
        assert not category.get('portrait') or category['portrait'] in images,'手机封面图片不存在'
    for key,text in config.get('fieldNotes',{}).items():
        assert key in ids and isinstance(text,str),'手记必须引用存在的照片，且为纯文本'
    for author,links in config.get('further',{}).items():
        for link in links:
            assert link['place']!=link['next'],'下一程不能指向自身'
            cover=ids.get(link['coverPhotoId'])
            assert cover and cover['author']==author and cover['place']==link['next'],'下一程封面归属不匹配'
    from urllib.parse import urlsplit
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
    try:
        _,photos=validate();print(f'PASS: config, {len(photos)} photo records, essays and local dependencies')
    except (ValueError,AssertionError,KeyError,json.JSONDecodeError) as e:
        raise SystemExit('配置检查失败：'+str(e))
