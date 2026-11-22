"""Import user-owned JPGs as web copies. Originals are read-only; GPS is not exported."""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image,ImageCms,ImageOps

def load_catalog(path):
    if not path.exists():return []
    return json.loads(path.read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))

def metadata(image):
    exif=image.getexif();details=exif.get_ifd(34665) if 34665 in exif else {}
    result={}
    for name,tag in [('camera',272),('lens',42036),('focalLength',37386),('aperture',33437),('exposure',33434),('iso',34855),('capturedAt',36867)]:
        value=details.get(tag,exif.get(tag))
        if value is None:continue
        if isinstance(value,bytes):value=value.decode('utf-8','replace').strip('\0')
        if name in ('camera','lens','capturedAt'):value=str(value)
        else:
            try:value=float(value)
            except (ValueError,TypeError,ZeroDivisionError):continue
        if name=='capturedAt':
            import datetime
            try:datetime.datetime.strptime(value,'%Y:%m:%d %H:%M:%S')
            except ValueError:continue
        result[name]=value
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input',required=True,type=Path)
    parser.add_argument('--output-root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--author',choices=['kai','friend'],default='kai')
    parser.add_argument('--place',required=True)
    parser.add_argument('--province-code',required=True,help='六位省级行政区代码')
    parser.add_argument('--theme',default='自然',help='与 site.config.js 中主题值对应')
    parser.add_argument('--tag',default='未分类')
    parser.add_argument('--append',action='store_true',help='保留已有照片并去重；默认替换示例目录')
    args=parser.parse_args();source=args.input.resolve();out=args.output_root.resolve()
    if not source.is_dir():parser.error('--input 必须是存在的照片文件夹')
    if out==source or source in out.parents:parser.error('输出目录不能位于原图目录中')
    if len(args.province_code)!=6 or not args.province_code.isdigit():parser.error('省级代码必须是六位数字')
    files=sorted(p for p in source.rglob('*') if p.is_file() and p.suffix.lower() in ('.jpg','.jpeg'))
    if not files:parser.error('没有找到 JPG/JPEG；未改动现有目录')
    catalog=out/'content/photos.js';records=load_catalog(catalog) if args.append else []
    ids={p['id'] for p in records};assets=out/'assets/uploads';assets.mkdir(parents=True,exist_ok=True)
    srgb=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB'));added=0
    for file in files:
        raw=file.read_bytes();key=args.author+'-'+hashlib.sha256(raw).hexdigest()[:16]
        if key in ids:continue
        with Image.open(io.BytesIO(raw)) as original:
            info=metadata(original);image=ImageOps.exif_transpose(original).convert('RGB')
            if original.info.get('icc_profile'):
                image=ImageCms.profileToProfile(image,ImageCms.ImageCmsProfile(io.BytesIO(original.info['icc_profile'])),srgb,outputMode='RGB')
            urls={};widths={};webp={}
            for variant,limit,quality in [('thumb',480,82),('display',1600,88),('large',2560,90)]:
                resized=image.copy();resized.thumbnail((limit,limit),Image.Resampling.LANCZOS)
                relative=f'assets/uploads/{key}-{variant}.jpg'
                resized.save(out/relative,quality=quality,optimize=True,progressive=True,icc_profile=srgb.tobytes())
                urls[variant]=relative;widths[variant]=resized.width
                if variant!='large':
                    from PIL import features
                    if features.check('webp'):
                        alternate=f'assets/uploads/{key}-{variant}.webp'
                        resized.save(out/alternate,format='WEBP',quality=80,method=6)
                        webp[variant]=alternate
            year=info.get('capturedAt','')[:4]
            records.append({'id':key,'image':key,'author':args.author,'place':args.place,'region':args.place,'provinceCode':args.province_code,'filename':file.name,'width':image.width,'height':image.height,'metadata':info,'urls':urls,'renditionWidths':widths,'webp':webp,'real':True,'sample':False,'title':file.stem,'theme':args.theme,'tags':[args.tag],'time':year if year.isdigit() else 'pending','label':args.place+' · '+file.stem})
            ids.add(key);added+=1
    catalog.parent.mkdir(parents=True,exist_ok=True)
    catalog.write_text('window.KAI_PHOTOS = '+json.dumps(records,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    print(f'Imported {added}; catalog {len(records)}; exact duplicates skipped. Originals unchanged.')
    print('Next: update covers/journeys/about image IDs and essay/fieldNotes/further photo IDs in site.config.js; run tools/check.py.')

if __name__=='__main__':main()
