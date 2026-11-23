function renderAtlas(compass){
  document.title='行迹｜'+site.brand.title;
  document.body.classList.add('atlas-preview-page');
  document.querySelector('.places')?.remove();$('author-panel')?.remove();
  const head=document.querySelector('.page-head');head.classList.add('atlas-head');
  head.querySelector('.eyebrow')?.remove();
  head.querySelector('h1').innerHTML='行迹 <span class="title-english" lang="en">Atlas</span>';
  head.querySelector('p').textContent='点亮的地方，留有光影。';
  const stage=document.querySelector('.map-stage');stage.className='atlas-stage';
  const map=window.KAI_PROVINCE_MAP,summary=KaiAtlas.summary(photos);
  if(!map){stage.innerHTML='<div class="atlas-map-error"><h2>地图暂时未能载入</h2><p>仍可按地区翻阅作品。</p><a href="chapters.html">打开旅行章节 ↗</a></div>';return;}
  if(map.schematic)head.querySelector('p').textContent='省级地区索引示意 · 非地理边界';
  const svg=name=>`<svg viewBox="0 0 20 20" aria-hidden="true">${name==='plus'?'<path d="M4 10h12M10 4v12"/>':name==='minus'?'<path d="M4 10h12"/>':'<path d="M5 5a6.5 6.5 0 1 1-1.4 7M5 1v4H1"/>'}</svg>`;
  stage.innerHTML=`<div class="atlas-browser"><div class="atlas-map-column"><div class="atlas-topline"><span lang="en">A shared atlas</span><span>${summary.visited.size} 地区 · ${summary.count} 张</span></div><div class="atlas-toolbar liquid-glass"><label for="province-select">浏览地区</label><select id="province-select" aria-label="选择省级地区"><option value="">请选择地区</option>${map.regions.map(r=>`<option value="${r.code}">${esc(r.name)}</option>`).join('')}</select><div class="map-controls"><button id="map-zoom-in" aria-label="放大地图">${svg('plus')}</button><button id="map-zoom-out" aria-label="缩小地图">${svg('minus')}</button><button id="map-reset" aria-label="重置地图">${svg('reset')}</button><span id="map-scale">100%</span></div></div><a class="atlas-skip" href="#atlas-preview">跳到作品预览</a><div class="atlas-canvas">${map.svg}<div class="atlas-compass">${compass}</div></div><p class="atlas-map-hint">点击点亮的省份，翻阅这一程。</p></div><aside id="atlas-preview" class="atlas-preview" aria-label="地区作品预览" aria-live="polite" tabindex="-1"></aside></div><div class="map-provenance"><span>${esc(map.attribution||site.map.attribution)}</span>${map.source?`<a href="${esc(map.source)}" target="_blank" rel="noreferrer">数据来源 ↗</a>`:''}</div>`;
  const paths=[...stage.querySelectorAll('[data-province]')],preview=$('atlas-preview'),selectInput=$('province-select'),geometry=$('map-geometry');
  const mobile=matchMedia('(max-width:760px), (max-width:1000px) and (max-height:500px), (pointer:coarse)'),canvas=stage.querySelector('.atlas-canvas');
  stage.querySelector('.atlas-toolbar').insertAdjacentHTML('afterend','<div class="atlas-touch-tools"><button id="atlas-choose" aria-expanded="false" aria-controls="atlas-regions">选择地区 <span lang="en">Places</span></button><button id="map-interact" aria-pressed="false" aria-controls="province-map">操作地图</button></div><div id="atlas-regions" class="atlas-region-list" hidden></div>');
  const regionList=$('atlas-regions'),chooser=$('atlas-choose'),interact=$('map-interact');
  regionList.innerHTML=map.regions.map(r=>KaiAtlas.region(r.code,photos,map.regions)).filter(r=>r.count).map(r=>`<section><h2>${esc(r.name)}</h2>${r.authors.map(group=>`<div class="atlas-region-author">${esc(authorName(group.author))}</div>${group.chapters.map(chapter=>`<a href="${chapter.url}"><span>${esc(chapter.place)}</span><small>${chapter.count} 张 <span aria-hidden="true">↗</span></small></a>`).join('')}`).join('')}</section>`).join('');
  chooser.onclick=()=>{regionList.hidden=!regionList.hidden;chooser.setAttribute('aria-expanded',String(!regionList.hidden));};
  regionList.addEventListener('keydown',event=>{if(event.key==='Escape'){regionList.hidden=true;chooser.setAttribute('aria-expanded','false');chooser.focus();}});
  let zoom=1,panX=0,panY=0,hoverTimer,current,operating=false,blockNextClick=false;
  const stateKey='kai:atlas:'+location.pathname+':v1';
  let saved=history.state?.kaiAtlas;
  if(!saved){try{saved=JSON.parse(sessionStorage.getItem(stateKey));}catch{}}
  const valid=saved&&map.regions.some(r=>String(r.code)===saved.code||saved.code==='')&&Number.isFinite(saved.zoom)&&saved.zoom>=1&&saved.zoom<=3;
  if(valid){zoom=saved.zoom;panX=Number.isFinite(saved.panX)?saved.panX:0;panY=Number.isFinite(saved.panY)?saved.panY:0;}
  function remember(){
    const state={code:current||'',zoom,panX,panY};
    try{history.replaceState({...history.state,kaiAtlas:state},'');}catch{}
    try{sessionStorage.setItem(stateKey,JSON.stringify(state));}catch{}
  }
  function activate(code){
    select(code);
    const destination=KaiAtlas.destination(KaiAtlas.region(code,photos,map.regions));
    if(destination&&!mobile.matches)location.assign(destination);
  }
  paths.forEach(path=>{
    const region=KaiAtlas.region(path.dataset.province,photos,map.regions);
    path.classList.toggle('visited',region.count>0);
    const destination=KaiAtlas.destination(region);
    path.setAttribute('role',destination&&!mobile.matches?'link':'button');
    path.setAttribute('aria-label',`${destination&&!mobile.matches?'进入':'预览'}${region.name} · ${region.count?region.count+'张作品':'暂无已上传作品'}`);
    path.setAttribute('aria-controls','atlas-preview');
  });
  function select(code){
    clearTimeout(hoverTimer);
    if(current===code)return;current=code;
    paths.forEach(path=>{const chosen=path.dataset.province===code;path.classList.toggle('selected',chosen);if(path.getAttribute('role')==='button')path.setAttribute('aria-pressed',String(chosen));else path.removeAttribute('aria-pressed');});
    selectInput.value=code;remember();
    const region=KaiAtlas.region(code,photos,map.regions);
    preview.classList.toggle('is-empty',!region?.count);
    if(!region){preview.innerHTML='<div class="atlas-empty"><span lang="en">Along the way</span><h2>选择一个地区</h2><p>从已点亮的省份，继续翻阅。</p></div>';return;}
    const cover=region.cover;
    const image=cover?media(cover.image,cover.label,'eager').replace(/sizes="[^"]*"/,'sizes="(max-width:760px) 80px, (max-width:960px) 160px, 34vw"'):'';
    preview.innerHTML=`${cover?`<figure id="atlas-cover" class="atlas-preview-photo">${image}<figcaption>${esc(authorName(cover.author))} · ${esc(cover.title)}</figcaption></figure>`:''}<div class="atlas-preview-copy"><h2 id="province-name">${esc(region.name)}</h2><p class="atlas-count">${region.count?region.count+' 张 · '+region.authors.length+' 位摄影者':'暂无已上传作品'}</p>${region.authors.map(group=>`<div class="atlas-author-works"><span>${esc(authorName(group.author))}</span>${group.chapters.map(chapter=>`<a class="atlas-work-link" href="${chapter.url}"><span>${esc(chapter.place)}<small>${chapter.count} 张</small></span><span class="atlas-enter">翻阅章节 <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h14m-5-5 5 5-5 5"/></svg></span></a>`).join('')}</div>`).join('')}${feature('secondAuthor')&&region.count&&!region.authors.some(group=>group.author==='friend')?`<p class="atlas-friend-pending">${esc(authorName('friend'))} · 暂无上传</p>`:''}</div>`;
    preview.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{
      const figure=img.closest('figure');figure.classList.add('image-missing');
      if(!figure.querySelector('.atlas-image-error'))figure.insertAdjacentHTML('beforeend','<span class="atlas-image-error">预览暂时未能载入<br>仍可翻阅章节</span>');
    }));
  }
  function scale(persist=true){
    panX=Math.max(-475*(zoom-1),Math.min(475*(zoom-1),panX));panY=Math.max(-315*(zoom-1),Math.min(315*(zoom-1),panY));
    geometry.setAttribute('transform',`translate(${475*(1-zoom)+panX} ${315*(1-zoom)+panY}) scale(${zoom})`);
    $('map-scale').textContent=Math.round(zoom*100)+'%';$('map-zoom-in').disabled=zoom>=3;$('map-zoom-out').disabled=zoom<=1;if(persist)remember();
  }
  paths.forEach(path=>{
    path.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse'||operating)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>select(path.dataset.province),120);});
    path.addEventListener('pointerleave',()=>clearTimeout(hoverTimer));
    path.addEventListener('focus',()=>{if(path.matches(':focus-visible'))select(path.dataset.province);});
    path.addEventListener('click',event=>{if(blockNextClick){blockNextClick=false;event.preventDefault();return;}activate(path.dataset.province);});
    path.addEventListener('keydown',e=>{if(e.key==='Enter'||(e.key===' '&&path.getAttribute('role')==='button')){e.preventDefault();activate(path.dataset.province);}});
  });
  selectInput.onchange=e=>select(e.target.value);
  $('map-zoom-in').onclick=()=>{zoom=Math.min(3,Math.round((zoom+.2)*10)/10);scale();};
  $('map-zoom-out').onclick=()=>{zoom=Math.max(1,Math.round((zoom-.2)*10)/10);scale();};
  $('map-reset').onclick=()=>{zoom=1;panX=panY=0;scale();select('');};
  const pointers=new Map();let gesture=null,dragged=false,clickReset=0,paintFrame=0;
  function flushMap(){cancelAnimationFrame(paintFrame);paintFrame=0;scale(false);}
  function mode(value){if(paintFrame||(operating&&pointers.size)){flushMap();remember();}operating=value;pointers.clear();gesture=null;interact.setAttribute('aria-pressed',String(value));interact.textContent=value?'完成操作':'操作地图';canvas.classList.toggle('is-interactive',value);}
  interact.onclick=()=>mode(!operating);
  const point=event=>{const rect=$('province-map').getBoundingClientRect();return {x:(event.clientX-rect.left)*950/(rect.width||950),y:(event.clientY-rect.top)*630/(rect.height||630),clientX:event.clientX,clientY:event.clientY};};
  function begin(){const values=[...pointers.values()];if(!values.length){gesture=null;return;}const [a,b]=values;gesture={a,b,zoom,panX,panY,distance:b?Math.hypot(b.x-a.x,b.y-a.y):0};}
  canvas.addEventListener('pointerdown',event=>{
    if(!operating||event.button>0)return;
    clearTimeout(clickReset);blockNextClick=false;clearTimeout(hoverTimer);
    if(!pointers.size)dragged=false;
    pointers.set(event.pointerId,point(event));begin();
    if(pointers.size>1){dragged=true;canvas.setPointerCapture?.(event.pointerId);}
  });
  canvas.addEventListener('pointermove',event=>{
    if(!operating||!pointers.has(event.pointerId)||!gesture)return;
    pointers.set(event.pointerId,point(event));const [a,b]=[...pointers.values()];
    if(b&&gesture.b){
      dragged=true;const distance=Math.hypot(b.x-a.x,b.y-a.y);zoom=Math.min(3,Math.max(1,gesture.zoom*distance/(gesture.distance||1)));
      const oldX=(gesture.a.x+gesture.b.x)/2,oldY=(gesture.a.y+gesture.b.y)/2;
      const worldX=(oldX-475*(1-gesture.zoom)-gesture.panX)/gesture.zoom,worldY=(oldY-315*(1-gesture.zoom)-gesture.panY)/gesture.zoom;
      panX=(a.x+b.x)/2-475*(1-zoom)-worldX*zoom;panY=(a.y+b.y)/2-315*(1-zoom)-worldY*zoom;
    }else{
      if(Math.hypot(a.clientX-gesture.a.clientX,a.clientY-gesture.a.clientY)>8)dragged=true;
      if(!dragged)return;panX=gesture.panX+a.x-gesture.a.x;panY=gesture.panY+a.y-gesture.a.y;
    }
    canvas.setPointerCapture?.(event.pointerId);
    if(!paintFrame)paintFrame=requestAnimationFrame(()=>{paintFrame=0;scale(false);});
  });
  function finish(event){
    if(!pointers.has(event.pointerId))return;
    pointers.delete(event.pointerId);if(canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    if(dragged||event.type==='pointercancel'){flushMap();remember();blockNextClick=true;clickReset=setTimeout(()=>{blockNextClick=false;},450);}
    begin();
  }
  canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
  canvas.addEventListener('keydown',event=>{if(event.key==='Escape')mode(false);});
  mobile.addEventListener('change',()=>{mode(false);paths.forEach(path=>{const region=KaiAtlas.region(path.dataset.province,photos,map.regions),direct=KaiAtlas.destination(region)&&!mobile.matches;path.setAttribute('role',direct?'link':'button');if(direct)path.removeAttribute('aria-pressed');else path.setAttribute('aria-pressed',String(path.classList.contains('selected')));path.setAttribute('aria-label',`${direct?'进入':'预览'}${region.name} · ${region.count?region.count+'张作品':'暂无已上传作品'}`);});stage.querySelector('.atlas-map-hint').textContent=mobile.matches?'轻点省份预览，再选择这一程。':'点击点亮的省份，翻阅这一程。';});
  stage.querySelector('.atlas-map-hint').textContent=mobile.matches?'轻点省份预览，再选择这一程。':'点击点亮的省份，翻阅这一程。';
  scale();select(valid?saved.code:summary.visited.has('510000')?'510000':map.regions.find(r=>summary.visited.has(String(r.code)))?.code||'');
}
