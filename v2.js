// Shared static-page runtime. Content belongs in site.config.js and content/photos.js.
function readSession(key){try{return sessionStorage.getItem(key);}catch{return null;}}
function writeSession(key,value){try{sessionStorage.setItem(key,value);}catch{}}
const $=id=>document.getElementById(id);
const site=window.PHOTO_SITE,feature=name=>site.features?.[name]!==false,photos=(window.KAI_PHOTOS||[]).filter(p=>feature('secondAuthor')||p.author==='kai');
const params=new URLSearchParams(location.search),rawPage=location.pathname.split('/').pop()||'index.html',page=rawPage.includes('.')?rawPage:rawPage+'.html';
const reference=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const categories=site.categories,places=[...new Set(photos.map(p=>p.place))].map(p=>[p]);
const assets=Object.fromEntries(photos.map(p=>[p.image,p.urls.display]));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const authorName=author=>site.authors[author]?.name||author;
const authorOptions=(selected)=>Object.entries(site.authors).filter(([id])=>feature("secondAuthor")||id==="kai").map(([id,a])=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(a.name)}</option>`).join('');
const wrapPhotoIndex=(index,count)=>(index+count)%count;
const filterPhotos=({author='kai',place='',theme='',time='',region='',tag='',travel=false})=>photos.filter(p=>p.author===author&&(!place||p.place===place)&&(!theme||p.theme===theme)&&(!time||p.time===time)&&(!region||p.region===region)&&(!tag||p.tags?.includes(tag))&&(!travel||p.travel!==false));
const workURL=(theme='',author='kai',place='')=>'works.html?'+new URLSearchParams({author,...(theme?{theme}:{}),...(place?{place}:{})});
let placeholders=false,selection=[],photoIndex=0,photoReturnURL='',paused=reduced,activeCover=0,pageSelection=[];
document.title=site.brand.title;
document.querySelector('meta[name="description"]').content=site.brand.description;
document.querySelector('.logo').innerHTML=`${esc(site.brand.name)}<span>${esc(site.brand.subtitle)}</span><i>•</i>`;
$('mode-note').textContent=site.brand.footer;

function media(key,label,loading='lazy',size='display'){
 const p=photos.find(p=>p.image===key);
 if(!p)return '<span class="media missing-media"><span class="placeholder">这里需要一张照片</span></span>';
 const variant=size==='archive'?'display':size,widths=p.renditionWidths;
 const sizes=size==='archive'?'(max-width:760px) calc((100vw - 52px) / 2), 34vw':loading==='eager'?'100vw':'(max-width:760px) 90vw, 60vw';
 const candidates=widths?[...new Map(Object.entries(p.urls).map(([name,url])=>[widths[name],url]))].sort((a,b)=>a[0]-b[0]):[];
 const srcset=candidates.length&&size!=='large'?`srcset="${candidates.map(([width,url])=>`${esc(url)} ${width}w`).join(', ')}" sizes="${sizes}"`:'';
 return `<span class="media real-photo">${p.webp?.[variant]&&size!=='large'?`<picture><source type="image/webp" srcset="${esc(p.webp[variant])}">`:''}<img src="${esc(p.urls[variant])}" ${srcset} alt="${esc(p.label||label)}" loading="${loading}" width="${p.width}" height="${p.height}">${p.webp?.[variant]&&size!=='large'?'</picture>':''}</span>`;
}
function photoButton(p,extra='',size='display'){return `<button class="photo-button ${extra}" data-photo="${esc(p.id)}" aria-label="查看${esc(p.label)}">${media(p.image,p.label,'lazy',size)}</button>`;}
function footer(){return `<footer class="about-footer"><span>${esc(site.brand.title)} · ${esc(site.brand.footer)}</span>${feature('map')?'<a href="journey.html">沿着行迹继续 ↗</a>':''}<a href="index.html">回到首页 ↑</a></footer>`;}
function authorTabs(view='journeys',selected='kai'){return `<nav class="chapters-authors" aria-label="选择摄影者">${Object.entries(site.authors).filter(([id])=>feature("secondAuthor")||id==="kai").map(([id,a])=>`<a href="chapters.html?${new URLSearchParams({author:id,...(view==='essays'?{view}:{})})}" ${id===selected?'aria-current="page"':''}>${esc(a.name)}</a>`).join('')}</nav>`;}
function homeCover(c,i){
 const wide=photos.find(p=>p.image===c.image),portrait=photos.find(p=>p.image===c.portrait)||wide;
 if(!wide)return '<span class="placeholder">首页主视觉 · 这里需要封面照片</span>';
 return `<picture>${portrait.webp?.display?`<source type="image/webp" media="(max-width:760px) and (orientation:portrait)" ${i?'data-srcset':'srcset'}="${esc(portrait.webp.display)}">`:''}<source media="(max-width:760px) and (orientation:portrait)" ${i?'data-srcset':'srcset'}="${esc(portrait.urls.display)}"><img ${i?'data-src':'src'}="${esc(wide.urls.display)}" alt="${esc(c.name)}封面" width="${wide.width}" height="${wide.height}" style="--mobile-focus:${esc(c.focus||'50% 50%')}" ${i?'':'fetchpriority="high"'}></picture>`;
}
function hydrateCover(i){const box=document.querySelectorAll('.backdrop')[i];box?.querySelectorAll('[data-src],[data-srcset]').forEach(e=>{for(const n of ['src','srcset'])if(e.hasAttribute('data-'+n)){e.setAttribute(n,e.getAttribute('data-'+n));e.removeAttribute('data-'+n);}});}
function home(){
 $('main').innerHTML=`<section class="home" aria-label="摄影首页"><div class="backdrops">${categories.map((c,i)=>`<div class="backdrop ${i===0?'active':''} real-backdrop">${homeCover(c,i)}</div>`).join('')}</div><h1 class="skip">${esc(site.brand.title)}</h1><div class="home-index">${categories.map((c,i)=>`<a class="index-row ${i===0?'active':''}" data-cover="${i}" href="${i===3?'chapters.html':workURL(c.theme)}"><span class="index-number">0${i+1}</span><span class="index-title">${esc(c.name)}</span><small>${esc(c.desc)}</small></a>`).join('')}</div><footer class="home-footer"><span>${esc(categories.slice(0,3).map(c=>c.name).join(' · '))} / ${esc(site.brand.name)}</span><div class="cover-controls"><button id="cover-prev" aria-label="上一张封面">←</button><button id="cover-view" aria-label="查看当前封面完整照片"><span id="cover-count"></span></button><button id="cover-next" aria-label="下一张封面">→</button><button id="cover-pause">${paused?'播放':'暂停'}</button></div><span>${esc(site.brand.homeNote)}</span></footer></section>`;
 const count=categories.length,change=n=>{activeCover=wrapPhotoIndex(n,count);hydrateCover(activeCover);document.querySelectorAll('.backdrop,[data-cover]').forEach(el=>el.classList.toggle('active',el.matches('.backdrop')?[...el.parentNode.children].indexOf(el)===activeCover:+el.dataset.cover===activeCover));$('cover-count').textContent=`${String(activeCover+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;};
 document.querySelectorAll('[data-cover]').forEach(el=>{el.addEventListener('pointerenter',()=>change(+el.dataset.cover));el.addEventListener('focus',()=>change(+el.dataset.cover));});
 $('cover-view').onclick=()=>{const c=categories[activeCover],key=matchMedia('(max-width:760px) and (orientation:portrait)').matches?(c.portrait||c.image):c.image,p=photos.find(p=>p.image===key);if(!p)return;selection=photos.filter(item=>item.author===p.author);photoIndex=selection.findIndex(item=>item.id===p.id);photoReturnURL=location.href;showPhoto();};
 $('cover-prev').onclick=()=>change(activeCover-1);$('cover-next').onclick=()=>change(activeCover+1);$('cover-pause').onclick=()=>{paused=!paused;$('cover-pause').textContent=paused?'播放':'暂停';};change(0);
 setInterval(()=>{if(!paused&&!document.hidden&&!document.querySelector('dialog[open]'))change(activeCover+1);},6500);
}
function renderTravelChapters(){
 const author=params.get('author')==='friend'?'friend':'kai',pool=filterPhotos({author,travel:true}),groups=[...new Set(pool.map(p=>p.place))];
 $('main').innerHTML=`<header class="page-head chapters-head"></header>${authorTabs('journeys',author)}<div class="journey-index">${groups.map(place=>{const group=pool.filter(p=>p.place===place),cover=group.find(p=>p.image===site.journeys[place]?.cover)||group[0];return `<a class="journey-entry" href="series.html?${new URLSearchParams({place,author})}">${media(cover.image,`${place}系列封面`)}<div><h2>${esc(place)}</h2><span>${group.length} 张 · 翻阅旅行系列 ↗</span></div></a>`;}).join('')||'<p class="empty-state">暂无已上传作品。</p>'}</div>${footer()}`;
}
function about(){
 const a=site.about;
 $('main').innerHTML=`<section class="about-hero"><span class="eyebrow">${esc(site.brand.name)} / THE PERSON BEHIND THE FRAME</span><h1>${esc(a.heading)}</h1><div class="portrait-placeholder">${a.portrait?media(a.portrait,'个人照片','eager'):'<span class="placeholder">这里可以放置个人照片</span>'}</div><div class="signature">by ${esc(site.brand.name)}</div><p>${esc(a.intro)}</p></section><div class="about-body">${a.sections.map((s,i)=>`<section class="about-section"><div><span class="eyebrow">0${i+1} / ${esc(s.en)}</span><h2>${esc(s.title)}</h2>${s.image?media(s.image,s.title):''}</div><div><p>${esc(s.text)}</p></div></section>`).join('')}</div>${footer()}`;
 document.title='关于｜'+site.brand.title;
}
function journey(){$('main').innerHTML=`<header class="page-head"><h1>行迹</h1><p>点亮的地方，留有光影。</p></header><div class="map-stage"></div>${footer()}`;}
function series(){if(params.has('essay')){renderEssay();return;}const author=params.get('author')==='friend'?'friend':'kai',place=params.get('place')||filterPhotos({author})[0]?.place;if(filterPhotos({author,place}).length)realSeries(author,place);else renderArchivePage();}
function bindPhotos(){document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{const p=photos.find(p=>p.id===b.dataset.photo);if(!p)return;selection=photos.filter(picture=>picture.author===p.author);photoIndex=selection.findIndex(picture=>picture.id===p.id);photoReturnURL=location.href;showPhoto();});}
function showPhoto(){
 const p=selection[photoIndex];if(!p)return;
 $('lightbox-image').innerHTML=media(p.image,p.label,'eager','large');$('lightbox-credit').textContent=authorName(p.author)+' · '+p.region;
 $('photo-count').textContent=`${photoIndex+1} / ${selection.length}`;$('photo-prev').disabled=$('photo-next').disabled=selection.length<2;
 $('photo-info').innerHTML=photoMetadata(p);
 const url=new URL(location.href);url.searchParams.set('photo',p.id);history.replaceState(null,'',url);
 if(!$('lightbox').open){$('photo-info').hidden=true;$('photo-info-toggle').setAttribute('aria-expanded','false');$('copy-status').textContent='';$('lightbox').showModal();}
 document.dispatchEvent(new CustomEvent('kai:photo-change',{detail:{photo:p,index:photoIndex,total:selection.length}}));
}
if(page==='chapters.html')renderChapters();else if(page==='series.html')series();else if(page==='about.html')about();else if(page==='journey.html')journey();else if(page==='works.html')renderArchivePage();else home();
pageSelection=selection;bindPhotos();
const currentAuthor=params.get('author')==='friend'?'friend':'kai';
$('menu-rows').innerHTML=`<nav class="browse-links" aria-label="更多浏览方式"><a href="chapters.html?author=${currentAuthor}">旅行章节 <small lang="en">Journeys</small></a><a href="chapters.html?view=essays&author=${currentAuthor}">专题 <small lang="en">Essays</small></a><a href="works.html?author=${currentAuthor==='kai'?'friend':'kai'}">${esc(authorName(currentAuthor==='kai'?'friend':'kai'))} <small lang="en">Another perspective</small></a></nav>`;
function openMenu(){$('menu').showModal();$('menu-open').setAttribute('aria-expanded','true');$('mobile-menu').setAttribute('aria-expanded','true');}
$('menu-open').onclick=$('mobile-menu').onclick=openMenu;$('menu-close').onclick=()=>$('menu').close();
$('menu').addEventListener('close',()=>{for(const id of ['menu-open','mobile-menu'])$(id).setAttribute('aria-expanded','false');});
$('photo-close').onclick=()=>$('lightbox').close();$('sheet-close').onclick=()=>$('contact-sheet').close();
$('lightbox').addEventListener('close',()=>{const url=new URL(photoReturnURL||location.href);url.searchParams.delete('photo');history.replaceState(null,'',url);});
$('copy-photo').onclick=async()=>{const p=selection[photoIndex];if(!p)return;const url=new URL('works.html',location.href);url.searchParams.set('author',p.author);url.searchParams.set('photo',p.id);try{await navigator.clipboard.writeText(url.href);$('copy-status').textContent='照片链接已复制';}catch{$('copy-status').textContent='请复制此链接：'+url.href;}};
for(const dialog of document.querySelectorAll('dialog')){
 const sync=()=>document.body.style.overflow=document.querySelector('dialog[open]')?'hidden':'';
 dialog.addEventListener('close',sync);new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open']});
}
const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}}),{threshold:.08});
document.querySelectorAll('.chapter-heading,.about-section,.photo-pair,.triptych').forEach(el=>{el.classList.add('reveal');revealObserver.observe(el);});
if(params.get('photo')){const p=photos.find(p=>p.id===params.get('photo'));if(p&&(!(page==='series.html'&&params.has('essay'))||document.body.dataset.essay&&p.author===currentAuthor)){selection=photos.filter(item=>item.author===p.author);photoIndex=selection.indexOf(p);photoReturnURL=location.href;showPhoto();}}
window.addEventListener('pagehide',()=>writeSession('scroll:'+location.pathname+location.search,String(scrollY)));
if(performance.getEntriesByType('navigation')[0]?.type==='back_forward')requestAnimationFrame(()=>scrollTo(0,Number(readSession('scroll:'+location.pathname+location.search)||0)));
