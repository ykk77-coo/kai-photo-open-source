(()=>{
  const store=KaiReadingBookmarks.create({getStorage:()=>localStorage,photos,essays:window.KAI_ESSAYS||[],baseURL:location.href});
  const pendingKey='kai:reading-pending:v1';
  let pending=null,origin=null,row,restoreFrame,restoreObserver;
  try{
    const saved=JSON.parse(sessionStorage.getItem(pendingKey));sessionStorage.removeItem(pendingKey);
    if(saved&&Date.now()-saved.createdAt<120000&&saved.url===location.href){
      const record=store.read(saved.author);
      if(record&&record.photoId===new URL(location.href).searchParams.get('photo')&&new URL(record.url,location.href).href===location.href)pending=record;
    }
  }catch{/* A normal photo link still works when session storage is unavailable. */}
  const author=()=>new URLSearchParams(location.search).get('author')==='friend'?'friend':'kai';
  function anchors(id){return [...document.querySelectorAll('[data-photo]')].filter(el=>el.dataset.photo===id&&!el.closest('dialog'));}
  function capture(photo){
    const candidates=anchors(photo.id),nearest=candidates.reduce((best,el)=>!best||Math.abs(el.getBoundingClientRect().top)<Math.abs(best.getBoundingClientRect().top)?el:best,null);
    return {url:location.href,scrollY,anchorId:nearest?photo.id:'',anchorIndex:Math.max(0,candidates.indexOf(nearest)),anchorTop:nearest?.getBoundingClientRect().top||0};
  }
  function render(){
    if(!row)return;
    const record=store.read(author()),photo=record&&photos.find(p=>p.id===record.photoId);
    row.hidden=!photo;if(!photo)return;
    const link=$('continue-link');link.href=record.url;
    $('continue-place').textContent=photo.place;
    $('continue-title').textContent=photo.title||photo.label;
    const thumb=$('continue-thumb');thumb.src=photo.urls.thumb;thumb.alt='';thumb.hidden=false;
    thumb.onerror=()=>{thumb.hidden=true;};
    $('continue-status').textContent='';
  }
  function restore(){
    if(!pending)return;
    cancelAnimationFrame(restoreFrame);
    restoreFrame=requestAnimationFrame(()=>{
      if(!pending)return;
      const target=anchors(pending.anchorId)[pending.anchorIndex];
      const y=target?scrollY+target.getBoundingClientRect().top-pending.anchorTop:pending.scrollY;
      window.scrollTo({top:Math.max(0,y),behavior:'instant'});
    });
  }
  document.addEventListener('kai:photo-change',e=>{if(!origin)origin=pending||capture(e.detail.photo);});
  document.addEventListener('kai:photo-ready',e=>{
    const photo=e.detail.photo;
    if(!$('lightbox').open||!photo?.real)return;
    if(!origin)origin=pending||capture(photo);
    if(store.save(photo.id,origin))render();
  });
  document.addEventListener('DOMContentLoaded',()=>{
    row=document.createElement('section');row.id='continue-reading';row.className='continue-reading';row.hidden=true;row.setAttribute('aria-label','接着看');
    row.innerHTML=`<a id="continue-link" class="continue-link"><img id="continue-thumb" alt="" width="64" height="64"><span class="continue-copy"><span class="continue-heading">接着看 <small lang="en">Continue</small></span><span class="continue-meta"><span id="continue-place"></span><span id="continue-title"></span></span></span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5"/></svg></a><button id="continue-clear" type="button">清除记录</button><span id="continue-status" role="status"></span>`;
    $('menu-rows').before(row);render();
    for(const id of ['menu-open','mobile-menu'])$(id).addEventListener('click',render);
    $('continue-link').addEventListener('click',()=>{
      const record=store.read(author());if(!record)return;
      try{sessionStorage.setItem(pendingKey,JSON.stringify({url:new URL(record.url,location.href).href,author:record.author,createdAt:Date.now()}));}catch{}
    });
    $('continue-clear').onclick=()=>{
      if(store.clear(author())){render();$('menu-close').focus({preventScroll:true});}
      else $('continue-status').textContent='未能清除，请检查浏览器的本地存储设置。';
    };
    $('lightbox').addEventListener('close',()=>{
      origin=null;
      if(pending){
        restoreObserver?.disconnect();restore();
        const target=anchors(pending.anchorId)[pending.anchorIndex];
        target?.focus({preventScroll:true});
        requestAnimationFrame(()=>{pending=null;});
      }
    });
    if(pending){
      restore();restoreObserver=new ResizeObserver(restore);restoreObserver.observe($('main'));
      document.fonts?.ready.then(restore);
    }
    window.addEventListener('storage',e=>{if(e.key?.startsWith('kai:reading:'))render();});
  });
})();
