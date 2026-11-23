// Optional acceptance entry: tests an imported fixture, not the default demo IDs.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
(async()=>{const{Window}=await import(pathToFileURL(require.resolve('happy-dom')).href);const root=path.resolve(process.argv[2]);
const read=n=>fs.readFileSync(path.join(root,n),'utf8');for(const route of ['works.html','series.html?place=旅程甲','series.html?essay=test-essay','journey.html']){
 const w=new Window({url:'https://example.test/'+route,settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.performance.getEntriesByType=()=>[];w.document.fonts={ready:Promise.resolve()};w.Option=function(t,v){const e=w.document.createElement('option');e.textContent=t;e.value=v;return e;};w.document.write(read(route.split('?')[0]));w.eval([...w.document.scripts].map(s=>read(s.getAttribute('src'))).join('\n'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));const d=w.document;
 if(route==='works.html'){const buttons=[...d.querySelectorAll('main [data-photo]')];assert.equal(buttons.length,8);buttons[0].click();const first=new URL(w.location.href).searchParams.get('photo'),seen=new Set();for(let i=0;i<8;i++){seen.add(new URL(w.location.href).searchParams.get('photo'));d.querySelector('#photo-next').click();}assert.equal(seen.size,8);assert.equal(new URL(w.location.href).searchParams.get('photo'),first);assert.ok(d.querySelector('.photo-field-notes'));assert.equal(d.querySelectorAll('.exif-list').length,1);}
 if(route.includes('place='))assert.ok(d.querySelector('.further-link').href.includes(encodeURIComponent('旅程乙')));
 if(route.includes('essay='))assert.equal(d.querySelectorAll('main [data-photo]').length,8);
 if(route==='journey.html'){assert.equal(d.querySelectorAll('.province.visited').length,2);assert.equal(d.querySelectorAll('a[href*="author=friend"]').length,0);}
 await w.happyDOM.abort();
}console.log('PASS imported8: viewer fullcycle, EXIF/unknowns, notes, Further, essay8, map2, disabled author');})().catch(e=>{console.error(e);process.exitCode=1;});
