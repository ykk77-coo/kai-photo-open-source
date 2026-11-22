'use strict';
document.addEventListener('DOMContentLoaded',()=>{
  const box=$('lightbox'),stage=$('lightbox-image'),header=box.querySelector('header'),tools=box.querySelector('.photo-tools');
  const icons={
    info:'<circle cx="10" cy="10" r="7.3"/><path d="M10 9v5m0-9v.4"/>',
    more:'<circle cx="4" cy="10" r=".8"/><circle cx="10" cy="10" r=".8"/><circle cx="16" cy="10" r=".8"/>',
    zoom:'<circle cx="8.3" cy="8.3" r="5.5"/><path d="m12.4 12.4 5 5M5.7 8.3h5.2M8.3 5.7v5.2"/>',
    fit:'<path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4M7 10h6"/>',
    hide:'<path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4"/>',
    check:'<path d="m4 10 4 4 8-8"/>'
  };
  const icon=name=>`<svg viewBox="0 0 20 20" aria-hidden="true">${icons[name]}</svg>`;
  box.classList.add('immersive-viewer');
  $('photo-close').remove();box.appendChild(Object.assign(document.createElement('button'),{id:'photo-close',type:'button',innerHTML:galleryIcon('close')+'<span>关闭</span>'}));
  const close=$('photo-close');close.setAttribute('aria-label','关闭照片');close.onclick=()=>box.close();
  header.insertAdjacentHTML('afterbegin','<h2 id="viewer-title"></h2>');
  box.setAttribute('aria-labelledby','viewer-title');
  $('photo-info-toggle').innerHTML=icon('info')+'<span class="viewer-tool-label">信息</span>';
  $('photo-info-toggle').setAttribute('aria-label','照片信息');
  const copy=$('copy-photo');copy.remove();
  tools.insertAdjacentHTML('beforeend',`<button id="viewer-more" type="button" aria-label="更多看图选项" aria-expanded="false" aria-controls="viewer-more-panel">${icon('more')}<span class="viewer-tool-label">更多</span></button><div id="viewer-more-panel" class="viewer-more-panel" hidden inert><button type="button" id="viewer-zoom">${icon('zoom')}<span>放大细节</span><small>2×</small></button><button type="button" id="viewer-immerse">${icon('hide')}<span>沉浸看图</span></button></div>`);
  const more=$('viewer-more'),panel=$('viewer-more-panel');
  panel.appendChild(copy);copy.innerHTML=galleryIcon('link')+'<span>复制照片链接</span>';
  box.insertAdjacentHTML('beforeend','<p id="viewer-hint" class="viewer-hint">轻点画面，收起界面<span>Tap to immerse</span></p><div class="viewer-load-state" id="viewer-load-state" role="status" hidden></div>');
  const hint=$('viewer-hint'),status=$('viewer-load-state');
  let view={scale:1,x:0,y:0},current=null,immersed=false,lastId='',hintTimer,resizeFrame;
  const rect=()=>stage.getBoundingClientRect();
  const size=()=>({width:current?.width||stage.querySelector('img')?.naturalWidth||1,height:current?.height||stage.querySelector('img')?.naturalHeight||1});
  function paint(next){
    view=KaiPhotoGestures.clamp(next,rect(),size());
    const img=stage.querySelector('img');
    if(img)img.style.transform=`translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    box.classList.toggle('is-zoomed',view.scale>1.01);
    $('viewer-zoom').innerHTML=icon(view.scale>1.01?'fit':'zoom')+`<span>${view.scale>1.01?'恢复完整画面':'放大细节'}</span><small>${view.scale>1.01?'1×':'2×'}</small>`;
    $('viewer-zoom').setAttribute('aria-label',view.scale>1.01?'恢复完整画面':'放大照片至两倍');
  }
  function closeMore(restore=false){panel.hidden=true;panel.inert=true;more.setAttribute('aria-expanded','false');if(restore)more.focus({preventScroll:true});}
  function setImmersed(next){
    if(next&&status.dataset.state==='error')return;
    closeMore();
    if(next){$('photo-info').hidden=true;$('photo-info-toggle').setAttribute('aria-expanded','false');close.focus({preventScroll:true});}
    immersed=next;box.classList.toggle('is-immersed',next);header.inert=next;tools.inert=next;hint.hidden=true;
    if(next){box.removeAttribute('aria-labelledby');box.setAttribute('aria-label',(current?.title||current?.label||'照片')+'，沉浸看图');}
    else {box.setAttribute('aria-labelledby','viewer-title');box.removeAttribute('aria-label');}
    $('viewer-immerse').querySelector('span').textContent=next?'显示看图控件':'沉浸看图';
    requestAnimationFrame(()=>paint(view));
  }
  function step(direction){
    closeMore();photoIndex=wrapPhotoIndex(photoIndex+direction,selection.length);showPhoto();
  }
  const gestures=KaiPhotoGestures.attach(stage,{read:()=>view,write:paint,rect,size,onStep:step,onTap:()=>{if(!panel.hidden)closeMore();else setImmersed(!immersed);}});
  more.onclick=e=>{
    if(!panel.hidden){closeMore();return;}
    panel.hidden=false;panel.inert=false;more.setAttribute('aria-expanded','true');
    if(e.detail===0)$('viewer-zoom').focus();
  };
  $('viewer-zoom').onclick=()=>{paint(KaiPhotoGestures.zoom(view,view.scale>1.01?1:2,{x:0,y:0},rect(),size()));closeMore(true);};
  $('viewer-immerse').onclick=()=>setImmersed(!immersed);
  copy.addEventListener('click',()=>closeMore(true));
  $('photo-prev').onclick=()=>step(-1);$('photo-next').onclick=()=>step(1);
  $('photo-info-toggle').onclick=()=>{
    closeMore();paint({scale:1,x:0,y:0});
    const info=$('photo-info');info.hidden=!info.hidden;
    $('photo-info-toggle').setAttribute('aria-expanded',String(!info.hidden));
    requestAnimationFrame(()=>paint(view));
  };
  box.addEventListener('keydown',e=>{
    if(e.key==='Tab'&&immersed)setImmersed(false);
    if(e.key==='Escape'&&!panel.hidden){e.preventDefault();e.stopPropagation();closeMore(true);return;}
    if(!panel.hidden&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
      e.preventDefault();const items=[...panel.querySelectorAll('button,a')],i=items.indexOf(document.activeElement);
      const n=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
      items[n].focus();return;
    }
    if(!panel.hidden)return;
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1);}
    if(e.key==='+'||e.key==='='||e.key==='-'){
      e.preventDefault();paint(KaiPhotoGestures.zoom(view,view.scale+(e.key==='-'?-.25:.25),{x:0,y:0},rect(),size()));
    }
    if(e.key==='0'){e.preventDefault();paint({scale:1,x:0,y:0});}
  });
  box.addEventListener('pointerdown',e=>{if(!tools.contains(e.target))closeMore();});
  box.addEventListener('focusin',e=>{if(!tools.contains(e.target))closeMore();});
  box.addEventListener('close',()=>{
    closeMore();setImmersed(false);gestures.reset();current=null;lastId='';clearTimeout(hintTimer);status.hidden=true;
  });
  function photoChanged(p,index,total){
    if(!p)return;
    current=p;gestures.reset();paint({scale:1,x:0,y:0});closeMore();
    const fresh=p.id!==lastId;lastId=p.id;
    if(fresh)$('copy-status').textContent='';
    $('viewer-title').textContent=p.title||p.label;
    $('lightbox-credit').textContent=`${authorName(p.author)} · ${p.region}`;
    $('photo-count').innerHTML=`<small>${p.real?'全部光影':'参考位置'}</small><span>${String(index+1).padStart(2,'0')} / ${total}</span>`;
    $('photo-count').setAttribute('aria-live','polite');
    const img=stage.querySelector('img');
    if(!img)return;
    img.draggable=false;
    status.dataset.state='loading';status.textContent='照片载入中…';status.hidden=true;
    const loading=setTimeout(()=>{if(current===p&&status.dataset.state==='loading')status.hidden=false;},600);
    const loaded=()=>{clearTimeout(loading);if(current!==p||stage.querySelector('img')!==img)return;status.hidden=true;status.dataset.state='ready';paint(view);if(box.open)document.dispatchEvent(new CustomEvent('kai:photo-ready',{detail:{photo:p}}));};
    const failed=()=>{
      clearTimeout(loading);if(current!==p||stage.querySelector('img')!==img)return;
      setImmersed(false);status.dataset.state='error';status.hidden=false;
      status.innerHTML='<span>这张照片暂时未能载入</span><button type="button" id="viewer-retry">重新载入</button><small>也可以继续翻阅下一张</small>';
      $('viewer-retry').onclick=()=>{status.hidden=true;status.dataset.state='loading';img.src=img.src.split('?')[0]+'?retry='+Date.now();};
    };
    img.addEventListener('load',loaded);img.addEventListener('error',failed);
    if(img.complete){if(img.naturalWidth)loaded();else failed();}
    if(!box.dataset.hintShown){
      box.dataset.hintShown='true';hint.hidden=false;
      hintTimer=setTimeout(()=>{hint.hidden=true;},4500);
    }
  }
  document.addEventListener('kai:photo-change',e=>photoChanged(e.detail.photo,e.detail.index,e.detail.total));
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{gestures.reset();paint({scale:1,x:0,y:0});closeMore();});});
  new ResizeObserver(()=>{if(box.open)paint(view);}).observe(stage);
  document.dispatchEvent(new Event('kai:viewer-ready'));
  if(box.open){photoChanged(selection[photoIndex],photoIndex,selection.length);close.focus({preventScroll:true});}
});
