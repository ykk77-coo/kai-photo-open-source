// One measured container serves all desktop navigation panels.
(() => {
  if(!document.querySelector(".home"))return;
  const featured=filterPhotos({author:'kai',travel:true})[0],featuredPlace=featured?.place||'';
  const nav=document.querySelector('.desktop-nav'),header=document.querySelector('.site-header');
  const previewMedia=(...args)=>media(...args).replace(/\b(src|srcset)=/g,'data-$1=');
  const hydrate=host=>host?.querySelectorAll('[data-src],[data-srcset]').forEach(e=>{for(const n of ['src','srcset'])if(e.hasAttribute('data-'+n)){e.setAttribute(n,e.getAttribute('data-'+n));e.removeAttribute('data-'+n);}});
  const order=['explore','chapters','places'],navigationPlaces=[...new Set(filterPhotos({author:'kai'}).map(p=>p.place))].map(p=>[p]);
  nav.querySelector('a[href="journey.html"]').remove();
  nav.querySelector('a[href="works.html"]').remove();
  nav.querySelector('a[href="about.html"]').id='nav-about';
  nav.insertAdjacentHTML('afterbegin',`<div class="nav-triggers">${order.map((id,i)=>`<button class="nav-trigger" data-nav="${id}" aria-expanded="false" aria-controls="nav-${id}">${['探索','章节','行迹'][i]} <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden="true"><path d="M1 1l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></button>`).join('')}</div>`);
  nav.insertAdjacentHTML('beforeend',`<div class="morph-dropdown" id="morph-dropdown"><section class="nav-panel explore-panel" id="nav-explore" aria-label="探索作品" inert aria-hidden="true"><div class="explore-list">${categories.slice(0,3).map((c,i)=>`<a class="explore-row ${i===0?'is-active':''}" href="${workURL(c.theme)}" data-preview="${i}"><strong>${esc(c.name)}</strong><span>${esc(c.desc)}</span></a>`).join('')}</div><div class="explore-media" aria-hidden="true">${categories.slice(0,3).map((c,i)=>`<div class="preview-image ${i===0?'is-active':''}">${previewMedia(c.image,`${esc(c.name)}导航预览照片`)}</div>`).join('')}</div></section><section class="nav-panel chapters-panel" id="nav-chapters" aria-label="旅行章节" inert aria-hidden="true"><a class="chapter-card" href="${featured?'series.html?'+new URLSearchParams({place:featuredPlace,author:'kai'}):'chapters.html'}">${previewMedia(featured?.image,'旅行章节封面')}<span><strong>${esc(featuredPlace||'旅行章节')}</strong><small>翻阅旅行光影</small></span></a><a class="chapter-card" href="chapters.html">${previewMedia(categories[3].image,'旅行系列入口照片')}<span><strong>旅行系列</strong><small>按旅程翻阅光影</small></span></a></section><section class="nav-panel places-panel" id="nav-places" aria-label="地区作品" inert aria-hidden="true">${navigationPlaces.map(([name])=>`<a href="${workURL('','kai',name)}">${esc(name)}<span>↗</span></a>`).join('')}<a class="map-link" href="journey.html">打开共享地图 <span>↗</span></a></section></div>`);
  const rail=document.createElement('div');rail.className='nav-rail';nav.insertBefore(rail,nav.firstChild);rail.append(nav.querySelector('.nav-triggers'),$('nav-about'),$('menu-open'));
  const dd=$('morph-dropdown'),triggers=[...nav.querySelectorAll('[data-nav]')],panels=order.map(id=>$('nav-'+id));
  let current=null,closeTimer=0,openFrame=0;

  function place(id){const panel=$('nav-'+id),trigger=triggers[order.indexOf(id)];
    const width=panel.offsetWidth,height=panel.offsetHeight,hr=header.getBoundingClientRect(),tr=trigger.getBoundingClientRect();
    const x=Math.max(hr.left+12,Math.min(tr.left-20,hr.right-width-12))-(dd.offsetParent||header).getBoundingClientRect().left;
    dd.style.setProperty('--x',x+'px');dd.style.setProperty('--w',width+'px');dd.style.setProperty('--h',height+'px');
  }
  function cancelClose(){clearTimeout(closeTimer);}
  function close(restore=false){cancelClose();cancelAnimationFrame(openFrame);const previous=current;current=null;dd.classList.remove('open','instant','snap');panels.forEach(p=>{delete p.dataset.state;p.inert=true;p.setAttribute('aria-hidden','true');});triggers.forEach(t=>t.setAttribute('aria-expanded','false'));if(restore&&previous)triggers[order.indexOf(previous)].focus();}
  function open(id){cancelClose();if(browseMobile.matches||current===id)return;cancelAnimationFrame(openFrame);
    const panel=$('nav-'+id);hydrate(id==='explore'?panel.querySelector('.preview-image.is-active'):panel);
    if(!current){dd.classList.add('instant','snap');panels.forEach(p=>{p.classList.add('snap');delete p.dataset.state;});place(id);void dd.offsetWidth;dd.classList.remove('snap');panels.forEach(p=>p.classList.remove('snap'));dd.classList.add('open');openFrame=requestAnimationFrame(()=>dd.classList.remove('instant'));}
    else {dd.classList.remove('instant','snap');const direction=order.indexOf(id)>order.indexOf(current)?1:-1;$('nav-'+current).dataset.state=direction>0?'exit-left':'exit-right';panel.classList.add('snap');panel.dataset.state=direction>0?'exit-right':'exit-left';void panel.offsetWidth;panel.classList.remove('snap');place(id);}
    panels.forEach(p=>{const active=p===panel;p.inert=!active;p.setAttribute('aria-hidden',String(!active));if(!active&&p.dataset.state==='active')delete p.dataset.state;});panel.dataset.state='active';triggers.forEach(t=>t.setAttribute('aria-expanded',String(t.dataset.nav===id)));current=id;
  }
  function scheduleClose(delay=140){cancelClose();closeTimer=setTimeout(()=>close(),delay);}
  function focusPanel(id){open(id);$('nav-'+id).querySelector('a')?.focus();}
  for(const trigger of triggers){
    const id=trigger.dataset.nav;
    trigger.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')open(id);});
    trigger.addEventListener('click',e=>{if(current===id)close();else if(e.detail===0)focusPanel(id);else open(id);});
    trigger.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'||(e.key==='Tab'&&!e.shiftKey&&current===id)){e.preventDefault();focusPanel(id);}
    });
  }
  dd.addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!current)return;
    const index=order.indexOf(current),links=panels[index].querySelectorAll('a');
    if(e.shiftKey&&e.target===links[0]){e.preventDefault();triggers[index].focus();}
    else if(!e.shiftKey&&e.target===links[links.length-1]){e.preventDefault();close();(triggers[index+1]||$('nav-about')).focus();}
  });
  nav.addEventListener('pointerenter',cancelClose);dd.addEventListener('pointerenter',cancelClose);
  nav.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!dd.contains(document.activeElement))scheduleClose();});
  nav.addEventListener('focusout',e=>{if(!nav.contains(e.relatedTarget))scheduleClose(0);});
  for(const id of ['nav-about','menu-open'])$(id).addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')scheduleClose(60);});
  document.addEventListener('pointerdown',e=>{if(!nav.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current&&nav.contains(document.activeElement)){e.preventDefault();close(true);}});
  window.addEventListener('resize',()=>{if(browseMobile.matches)close();else if(current)place(current);});
  const previewImages=[...nav.querySelectorAll('.preview-image')],previewRows=[...nav.querySelectorAll('[data-preview]')];
  previewRows.forEach(row=>{const activate=()=>{hydrate(nav.querySelectorAll('.preview-image')[Number(row.dataset.preview)]);previewRows.forEach(r=>r.classList.toggle('is-active',r===row));previewImages.forEach((image,i)=>image.classList.toggle('is-active',i===Number(row.dataset.preview)));};row.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')activate();});row.addEventListener('focus',activate);});
  // Failed images expose their purpose instead of leaving a blank preview.
  nav.querySelectorAll('img').forEach(image=>{const fallback=()=>image.closest('.media')?.classList.add('image-missing');image.addEventListener('error',fallback);image.addEventListener('load',()=>image.closest('.media')?.classList.remove('image-missing'));if(image.hasAttribute('src')&&image.complete&&!image.naturalWidth)fallback();});
  // A first-visit entrance is separate from the existing photo crossfade/slow drift.
  const homeElement=document.querySelector('.home');if(homeElement&&!readSession('kai-hero-entered')){homeElement.classList.add('hero-enter');writeSession('kai-hero-entered','1');}
})();
