(()=>{
  'use strict';
  document.addEventListener('DOMContentLoaded',()=>{
    if(!feature('further')||page!=='series.html'||params.has('essay'))return;
    const author=params.get('author')==='friend'?'friend':'kai',place=params.get('place');
    const row=window.KAI_JOURNEY_LINKS?.[author]?.find(item=>item.place===place);
    if(!row||row.next===place||!photos.some(p=>p.real&&p.author===author&&p.place===place))return;
    const cover=photos.find(p=>p.real&&p.author===author&&p.place===row.next&&p.id===row.coverPhotoId);
    if(!cover)return;
    const host=document.querySelector('.next-series');if(!host)return;
    const section=document.createElement('section');section.className='further-journey';section.setAttribute('aria-labelledby','further-title');
    const href='series.html?'+new URLSearchParams({place:row.next,author});
    section.innerHTML=`<h2 id="further-title">下一程 <span lang="en">Further</span></h2><a class="further-link ${cover.height>cover.width?'portrait-cover':''}" href="${href}"><div class="further-photo" aria-hidden="true">${media(cover.image,cover.title||cover.label,'lazy')}</div><div class="further-copy"><h3>${esc(row.next)}</h3><span class="further-enter">继续这一程 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></span><span class="sr-only">摄影者 ${esc(authorName(author))}</span></div></a><a class="further-all" href="chapters.html?${new URLSearchParams({author})}">全部旅程</a>`;
    host.replaceWith(section);
    if(location.hash==='#further-title'&&performance.getEntriesByType('navigation')[0]?.type!=='back_forward')requestAnimationFrame(()=>$('further-title').scrollIntoView({block:'start',behavior:'instant'}));
    section.querySelector('.further-link').addEventListener('click',()=>{
      try{history.replaceState({...history.state,kaiFurtherReturn:{y:scrollY}},'');}catch{}
    });
  });
  window.addEventListener('pageshow',e=>{
    const state=history.state?.kaiFurtherReturn;
    if(!state||!Number.isFinite(state.y)||!(e.persisted||performance.getEntriesByType('navigation')[0]?.type==='back_forward'))return;
    const {kaiFurtherReturn,...remaining}=history.state;
    try{history.replaceState(remaining,'');}catch{}
    const restore=()=>requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,state.y),behavior:'instant'}));
    restore();document.fonts?.ready.then(restore);
  });
})();
