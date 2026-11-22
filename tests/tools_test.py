"""Integration fixtures are generated here; no personal photographs are used."""
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]

class ToolsTest(unittest.TestCase):
    def test_photo_import_preserves_original_and_parameters(self):
        self.assertTrue((ROOT/'tools/import_photos.py').exists(),'portable photo importer is missing')
        from PIL import Image
        scratch=ROOT/'private';scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            base=Path(temp);source=base/'originals';source.mkdir();output=base/'site'
            picture=Image.new('RGB',(640,480),'#65858a');exif=Image.Exif()
            exif[274]=6;exif[272]='TEST CAMERA';exif[33437]=2.8;exif[33434]=0.008;exif[34855]=200
            original=source/'test.jpg';picture.save(original,exif=exif)
            (source/'duplicate.JPG').write_bytes(original.read_bytes())
            before=hashlib.sha256(original.read_bytes()).hexdigest()
            args=[sys.executable,str(ROOT/'tools/import_photos.py'),'--input',str(source),'--output-root',str(output),'--place','测试旅程','--province-code','510000','--theme','自然','--tag','测试图形']
            result=subprocess.run(args,capture_output=True,text=True,encoding='utf-8')
            self.assertEqual(result.returncode,0,result.stderr)
            content=(output/'content/photos.js').read_text(encoding='utf-8')
            records=json.loads(content.split('=',1)[1].strip().removesuffix(';'))
            self.assertEqual(len(records),1);p=records[0]
            self.assertEqual((p['width'],p['height']),(480,640))
            self.assertEqual(p['metadata']['camera'],'TEST CAMERA');self.assertEqual(p['metadata']['aperture'],2.8)
            self.assertEqual(p['metadata']['iso'],200);self.assertNotIn('capturedAt',p['metadata'])
            self.assertEqual(p['time'],'pending');self.assertNotIn(str(source),content)
            self.assertFalse(p['sample'])
            for url in p['urls'].values():
                with Image.open(output/url) as image:self.assertFalse(image.getexif());self.assertEqual(image.format,'JPEG')
            self.assertEqual(hashlib.sha256(original.read_bytes()).hexdigest(),before)
            subprocess.run(args,check=True,capture_output=True)
            self.assertEqual((output/'content/photos.js').read_text(encoding='utf-8'),content)

    def test_map_adapter_and_attribution(self):
        spec=importlib.util.spec_from_file_location('template_map',ROOT/'tools/map.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        demo=module.payload();self.assertEqual(len(demo['regions']),34);self.assertTrue(demo['schematic'])
        geo={'type':'FeatureCollection','features':[{'properties':{'adcode':510000,'name':'测试地区'},'geometry':{'type':'Polygon','coordinates':[[[100,25],[102,25],[102,27],[100,25]]]}}]}
        data=module.payload(geo,'Generated test geometry; MIT','https://example.test/source')
        self.assertFalse(data['schematic']);self.assertIn('510000',data['svg']);self.assertEqual(len(data['regions']),1)
        self.assertIn('Generated test geometry',data['attribution'])

    def test_deploy_build_keeps_notices_and_excludes_unreferenced_files(self):
        scratch=ROOT/'private';scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            fixture=Path(temp)/'template'
            shutil.copytree(ROOT,fixture,ignore=shutil.ignore_patterns('private','node_modules','dist','dist-*','__pycache__'))
            (fixture/'private.js').write_text('const privateNote="not for deployment";',encoding='utf-8')
            (fixture/'private.html').write_text('not for deployment',encoding='utf-8')
            result=subprocess.run([sys.executable,str(fixture/'tools/build.py')],capture_output=True,text=True,encoding='utf-8')
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertTrue((fixture/'dist/LICENSE').is_file(),'deployed source loses MIT notice')
            self.assertTrue((fixture/'dist/THIRD_PARTY_NOTICES.md').is_file())
            self.assertFalse((fixture/'dist/private.js').exists())
            self.assertFalse((fixture/'dist/private.html').exists())

if __name__=='__main__':unittest.main()
