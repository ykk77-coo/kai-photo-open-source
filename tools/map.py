"""Generate an original schematic or convert locally licensed GeoJSON. No downloads."""
import argparse
import html
import json
import math
from pathlib import Path

REGIONS=[('110000','北京市'),('120000','天津市'),('130000','河北省'),('140000','山西省'),('150000','内蒙古自治区'),('210000','辽宁省'),('220000','吉林省'),('230000','黑龙江省'),('310000','上海市'),('320000','江苏省'),('330000','浙江省'),('340000','安徽省'),('350000','福建省'),('360000','江西省'),('370000','山东省'),('410000','河南省'),('420000','湖北省'),('430000','湖南省'),('440000','广东省'),('450000','广西壮族自治区'),('460000','海南省'),('500000','重庆市'),('510000','四川省'),('520000','贵州省'),('530000','云南省'),('540000','西藏自治区'),('610000','陕西省'),('620000','甘肃省'),('630000','青海省'),('640000','宁夏回族自治区'),('650000','新疆维吾尔自治区'),('710000','台湾省'),('810000','香港特别行政区'),('820000','澳门特别行政区')]

def payload(source=None,attribution='',source_url=''):
    paths=[];regions=[]
    if source:
        features=source.get('features',[])
        allowed=dict(REGIONS);points=[];parsed=[]
        for f in features:
            prop=f.get('properties',{});code=str(prop.get('adcode',prop.get('code','')))
            if code not in allowed: continue
            g=f['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']] if g['type']=='Polygon' else []
            if not polys: continue
            parsed.append((code,prop.get('name') or allowed[code],polys))
            points.extend(p for poly in polys for ring in poly for p in ring)
        if not parsed:raise ValueError('未找到含六位 code/adcode 的 Polygon/MultiPolygon 省级地区')
        def mercator(p):
            lon,lat=map(float,p[:2])
            if not math.isfinite(lon) or not math.isfinite(lat) or not -85<lat<85:raise ValueError('坐标超出支持范围')
            return lon,-math.degrees(math.log(math.tan(math.pi/4+math.radians(lat)/2)))
        xy=[mercator(p) for p in points];left=min(x for x,y in xy);top=min(y for x,y in xy)
        width=max(x for x,y in xy)-left;height=max(y for x,y in xy)-top
        if not width or not height:raise ValueError('边界面积无效')
        scale=min(880/width,550/height)
        def project(p):
            x,y=mercator(p);return 35+(880-width*scale)/2+(x-left)*scale,30+(550-height*scale)/2+(y-top)*scale
        for code,name,polys in parsed:
            d=''.join('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in map(project,ring))+'Z' for poly in polys for ring in poly)
            paths.append((code,name,d));regions.append({'code':code,'name':name})
    else:
        for i,(code,name) in enumerate(REGIONS):
            x=40+i%7*125;y=35+i//7*110;w=105;h=82;r=14
            d=f'M{x+r},{y}h{w-2*r}q{r},0 {r},{r}v{h-2*r}q0,{r} -{r},{r}h-{w-2*r}q-{r},0 -{r},-{r}v-{h-2*r}q0,-{r} {r},-{r}Z'
            paths.append((code,name,d));regions.append({'code':code,'name':name})
        attribution='原创省级地区索引示意，非地理边界；省份分配仅为功能演示。'
    if source_url and not source_url.startswith(('https://','http://')):raise ValueError('来源链接必须是 HTTP(S) 地址')
    svg='<svg id="province-map" viewBox="0 0 950 640" xmlns="http://www.w3.org/2000/svg" aria-label="'+('省级地区边界图' if source else '省级地区索引示意图，非地理边界')+'"><g id="map-geometry">'
    svg+=''.join(f'<path class="province" data-province="{code}" d="{d}" fill-rule="evenodd" tabindex="0" role="button" aria-label="{html.escape(name,quote=True)}"><title>{html.escape(name)}</title></path>' for code,name,d in paths)
    svg+='</g></svg>'
    return {'svg':svg,'regions':regions,'source':source_url,'attribution':attribution,'schematic':not bool(source)}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input',type=Path,help='用户已确认可使用的本地 GeoJSON')
    parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'assets/china-map.js')
    parser.add_argument('--attribution',default='')
    parser.add_argument('--source-url',default='')
    args=parser.parse_args()
    if args.input and not args.attribution:parser.error('自备边界数据必须填写 --attribution 来源及许可说明')
    data=payload(json.loads(args.input.read_text(encoding='utf-8')) if args.input else None,args.attribution,args.source_url)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text('window.KAI_PROVINCE_MAP = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print(f"Generated {len(data['regions'])} regions; schematic={data['schematic']}")

if __name__=='__main__':main()
