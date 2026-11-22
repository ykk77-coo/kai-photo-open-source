"""Create a static deploy folder from an allowlist. No originals, tests or unused photos."""
import argparse
from pathlib import Path
import shutil
from check import ROOT,validate

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'dist')
    args=parser.parse_args();_,photos=validate()
    out=args.output.resolve()
    if out==ROOT or not out.is_relative_to(ROOT):parser.error('输出目录必须是模板文件夹中的子目录')
    if out.exists():parser.error('输出目录已存在；请选择一个新的目录，避免覆盖已有成果')
    runtime=['index.html','works.html','chapters.html','series.html','journey.html','about.html','404.html',
             'site.config.js','v2.js','photography.js','gallery.js','essays.js','atlas-data.js','atlas.js',
             'visitor.js','home-navigation.js','polish.js','viewer.js','viewer-gestures.js','bookmarks.js',
             'continue.js','encounter.js','encounter-bag.js','v2.css','gallery.css','essays.css','atlas.css',
             'navigation.css','visitor.css','polish.css','viewer.css','continue.css','encounter.css','cities.css',
             'features.js','features.css','mobile-refinement.css','viewer-experience.js','viewer-experience.css','further.js','further.css','LICENSE','THIRD_PARTY_NOTICES.md']
    files={Path(name) for name in runtime}
    files|={Path(p) for photo in photos for p in photo['urls'].values()}
    files|={Path(url) for photo in photos for url in photo.get('webp',{}).values()}
    files|={Path('content/photos.js'),Path('assets/china-map.js'),Path('assets/hanken.woff2'),Path('assets/Hanken-OFL.txt')}
    for relative in sorted(files):
        target=out/relative;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/relative,target)
    print(f'Built {len(files)} static files in {out.name}; no original photos or tools included.')

if __name__=='__main__':main()
