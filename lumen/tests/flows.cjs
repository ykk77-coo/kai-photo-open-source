const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
(async()=>{
 assert.ok(fs.existsSync(path.join(root,'site.config.js')),'portable template config is missing');
 const {Window}=await import(pathToFileURL(require.resolve('happy-dom')).href);
 async function load(route,configure=()=>{}){
  const w=new Window({url:'https://example.test'+route,settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});
  w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.document.fonts={ready:Promise.resolve()};
  w.Option=function(text,value){const o=w.document.createElement('option');o.textContent=text;o.value=value;return o;};
  const requested=new URL(w.location.href).pathname.split('/').pop()||'index.html';
  w.document.write(read(requested.includes('.')?requested:requested+'.html'));
  w.eval(read('site.config.js')+'\n'+read('content/photos.js'));
  configure(w);
  const scripts=[...w.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')).filter(s=>!['site.config.js','content/photos.js'].includes(s));
  w.eval(scripts.map(read).join('\n')+'\nwindow.__photos=photos;');
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return w;
 }
 const routes=['/','/works','/chapters','/chapters?view=essays','/series?place=山间&author=kai','/series?essay=demo-light&author=kai','/journey','/about','/works?author=friend','/works?photo=demo-03','/series?essay=demo-light&author=kai&photo=demo-03','/series?essay=missing&photo=demo-03'];
 for(const route of routes){
  const w=await load(route);try{
   const d=w.document;assert.ok(d.querySelector('main').textContent.trim(),route);
   assert.ok(!d.body.textContent.includes('光陰之間'),route);
   if(route==='/works'){
    const cards=[...d.querySelectorAll('main [data-photo]')];assert.equal(cards.length,10);
    cards[0].click();let first=new URL(w.location.href).searchParams.get('photo'),seen=new Set();
    for(let i=0;i<10;i++){seen.add(new URL(w.location.href).searchParams.get('photo'));d.querySelector('#photo-next').click();}
    assert.equal(seen.size,10);assert.equal(new URL(w.location.href).searchParams.get('photo'),first);
    assert.ok(d.querySelector('#photo-info').textContent.includes('示例'));
    const bag=w.KaiEncounterBag.create({getStorage:()=>null});
    assert.equal(new Set(Array.from({length:10},()=>bag.draw('kai',w.__photos).id)).size,10);
    d.querySelector('#photo-close').click();
    d.querySelector('[data-theme="城市"]').click();assert.equal(d.querySelectorAll('main [data-photo]').length,4);
    d.querySelector('#archive-place-trigger').click();d.querySelector('#archive-place-options [data-place="山间"]').click();
    assert.equal(d.querySelectorAll('main [data-photo]').length,0);
    d.querySelector('#archive-clear').click();assert.equal(d.querySelectorAll('main [data-photo]').length,10);
    const author=d.querySelector('select[name="author"]');author.value='friend';author.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(d.querySelectorAll('main [data-photo]').length,2);assert.ok(d.querySelector('#archive-summary').textContent.includes('同行者'));
   }
   if(route.includes('essay=demo-light'))assert.equal(d.querySelectorAll('main [data-photo]').length,8);
   if(route==='/journey'){
    assert.equal(d.querySelectorAll('.province').length,34);
    assert.equal(d.querySelectorAll('.province.visited').length,3);
    assert.ok(d.body.textContent.includes('非地理边界'));
    assert.ok(d.querySelector('.atlas-head>p').textContent.includes('非地理边界'),'schematic needs a visible upfront label');
    assert.match(w.KaiAtlas.destination(w.KaiAtlas.region('310000',w.__photos,w.KAI_PROVINCE_MAP.regions)),/place=/);
    assert.equal(w.KaiAtlas.destination(w.KaiAtlas.region('510000',w.__photos,w.KAI_PROVINCE_MAP.regions)),'');
   }
   if(route.includes('friend'))assert.equal(d.querySelectorAll('main [data-photo]').length,2);
   if(route.includes('photo=')&&!route.includes('essay=missing'))assert.equal(d.querySelector('#lightbox').open,true);
   if(route.includes('essay=missing'))assert.equal(d.querySelector('#lightbox').open,false);
   for(const img of d.querySelectorAll('main img')){
    assert.ok((img.getAttribute('src')||img.getAttribute('data-src'))?.startsWith('assets/demo/'));
    const descriptors=(img.getAttribute('srcset')||'').split(',').filter(Boolean).map(s=>s.trim().split(/\s+/).pop());
    assert.equal(new Set(descriptors).size,descriptors.length,'responsive image candidates must have unique width descriptors');
   }
  }finally{await w.happyDOM.abort();}
 }
 const empty=await load('/works',w=>{w.KAI_PHOTOS=[];});
 assert.equal(empty.document.querySelectorAll('main [data-photo]').length,0);await empty.happyDOM.abort();
 const custom=await load('/',w=>{w.PHOTO_SITE.brand.title='某人的摄影集';w.PHOTO_SITE.brand.name='Someone';});
 assert.equal(custom.document.title,'某人的摄影集');assert.ok(custom.document.querySelector('.logo').textContent.includes('Someone'));
 await custom.happyDOM.abort();
 const friendOnly=await load('/',w=>{for(const p of w.KAI_PHOTOS.filter(p=>p.author==='friend'))p.place='另一作者独有地区';});
 assert.ok(!friendOnly.document.querySelector('#nav-places').textContent.includes('另一作者独有地区'),'home menu must not expose empty main-author locations');
 await friendOnly.happyDOM.abort();
 const namedFriend=await load('/journey',w=>{w.PHOTO_SITE.authors.friend.name='某位同行';w.KAI_PHOTOS=w.KAI_PHOTOS.filter(p=>p.author!=='friend');});
 assert.ok(namedFriend.document.querySelector('#atlas-preview').textContent.includes('某位同行 · 暂无上传'));
 await namedFriend.happyDOM.abort();
 console.log('PASS: routes/config replacement, full cycle, random bag, essay8, map34/3, two authors, empty library, local-only demo assets');
})().catch(error=>{console.error(error);process.exit(1);});
