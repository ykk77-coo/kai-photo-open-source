window.KAI_ESSAYS=window.PHOTO_SITE.essays;
function getEssay(id,author){return window.KAI_ESSAYS.find(e=>e.id===id&&e.author===author);}
function getEssayPhotos(id,author){const e=getEssay(id,author);if(!e)return [];const chosen=e.photoIds.map(id=>photos.find(p=>p.id===id&&p.author===author));return chosen.length&&chosen.every(Boolean)?chosen:[];}
function essayListURL(author='kai'){return 'chapters.html?'+new URLSearchParams({view:'essays',author});}
function essayURL(id,author='kai'){return 'series.html?'+new URLSearchParams({essay:id,author});}
function chaptersSwitch(author,view){return `<nav class="chapters-switch" aria-label="章节浏览方式"><a href="chapters.html?${new URLSearchParams({author})}" ${view==='journeys'?'aria-current="page"':''}>旅程 <small>Journeys</small></a><a href="${essayListURL(author)}" ${view==='essays'?'aria-current="page"':''}>专题 <small>Essays</small></a></nav>`;}
function renderChapters(){
 const author=params.get('author')==='friend'?'friend':'kai',view=params.get('view')==='essays'?'essays':'journeys';document.body.classList.add('chapters-page');
 if(view==='journeys')renderTravelChapters();
 else{const available=window.KAI_ESSAYS.filter(e=>e.author===author&&getEssayPhotos(e.id,author).length);
  $('main').innerHTML=`<header class="page-head chapters-head"></header>${authorTabs('essays',author)}<div class="essay-index">${available.map(e=>{const chosen=getEssayPhotos(e.id,author),cover=chosen.find(p=>p.id===e.coverPhotoId)||chosen[0];return `<a class="essay-feature" href="${essayURL(e.id,author)}"><div class="essay-feature-copy"><h2>${esc(e.title)}</h2><p class="essay-feature-en">${esc(e.en)}</p><p class="essay-feature-meta">${chosen.length} 张 / ${esc(authorName(author))}</p><span class="essay-feature-enter">翻阅专题 ↗</span></div><div class="essay-feature-photo">${media(cover.image,cover.label,'eager')}</div></a>`;}).join('')||'<section class="essay-empty"><h2>专题尚未收录</h2><p>添加专题配置后即可展示。</p></section>'}</div>${footer()}`;
 }
 document.querySelector('.chapters-head').innerHTML=`<h1>沿途 <span>Journeys & Essays</span></h1>${chaptersSwitch(author,view)}`;document.title=(view==='essays'?'专题':'沿途')+'｜'+site.brand.title;
}
function essayFigure(p,index,total,wide=false){return `<figure class="essay-photo ${p.height>p.width?'portrait':'landscape'}"><button class="photo-button" data-photo="${esc(p.id)}" aria-label="查看${esc(p.label)}">${media(p.image,p.label,index===0?'eager':'lazy').replace(/sizes="[^"]*"/,`sizes="(max-width:760px) 88vw, ${wide?'100vw':'50vw'}"`)}</button><figcaption><span>${esc(p.region)}</span><span>${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span></figcaption></figure>`;}
function renderEssay(){
 const author=params.get('author')==='friend'?'friend':'kai',id=params.get('essay'),essay=getEssay(id,author),chosen=getEssayPhotos(id,author);document.body.classList.add('essay-page');
 if(!essay||!chosen.length){document.title='专题尚未收录｜'+site.brand.title;$('main').innerHTML=`<section class="essay-unavailable"><h1>这一辑，尚未收录。</h1><p>专题未找到或照片尚未齐备。</p><a href="${essayListURL(author)}">回到专题目录 ↗</a></section>${footer()}`;return;}
 document.body.dataset.essay=id;selection=chosen;document.title=essay.title+'｜'+site.brand.title;
 const figure=(i,wide=false)=>essayFigure(chosen[i],i,chosen.length,wide);let body='';
 for(let i=1;i<chosen.length;){const pair=(i===1||i===5)&&i+1<chosen.length;const cls=pair?'essay-pair':i===3?'essay-wide':i===chosen.length-1?'essay-closing':'essay-single';body+=`<section class="${cls}" aria-label="专题照片 ${i+1}">${figure(i,i===3)}${pair?figure(i+1):''}</section>`;i+=pair?2:1;}
 $('main').innerHTML=`<article class="editorial essay-editorial"><section class="essay-opening"><div class="essay-opening-copy"><a class="essay-back" href="${essayListURL(author)}">专题目录 ↗</a><h1>${esc(essay.title)}</h1><p class="essay-english">${esc(essay.en)}</p><p class="essay-byline">${esc(authorName(author))}<span>${chosen.length} 张</span></p><p class="essay-view-note">点击照片，循环翻阅全部光影。</p></div>${figure(0)}</section>${body}<nav class="essay-end"><a href="${essayListURL(author)}">回到专题目录 ↗</a><a href="${workURL('',author)}">所有光影 ↗</a></nav></article>${footer()}`;
}
document.addEventListener('kai:viewer-ready',()=>{if(!document.body.dataset.essay)return;const b=document.createElement('button');b.type='button';b.id='essay-return';b.innerHTML=galleryIcon('prev')+'<span>回到专题</span>';b.onclick=()=>$('lightbox').close();$('viewer-more-panel').appendChild(b);});
