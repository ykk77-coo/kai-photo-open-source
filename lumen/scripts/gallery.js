/* Photo archive and shared viewing controls. Content lives in the catalog. */
const galleryIcon=(name)=>`<svg viewBox="0 0 20 20" aria-hidden="true">${{
  pin:'<path d="M15.5 8c0 4-5.5 9-5.5 9S4.5 12 4.5 8a5.5 5.5 0 1 1 11 0Z"/><circle cx="10" cy="8" r="1.7"/>',
  chevron:'<path d="m5 8 5 5 5-5"/>',check:'<path d="m4 10 4 4 8-8"/>',
  filter:'<path d="M3 6h14M3 14h14M7 3v6M13 11v6"/>',close:'<path d="m5 5 10 10M15 5 5 15"/>',
  prev:'<path d="M17 10H3m6-6-6 6 6 6"/>',next:'<path d="M3 10h14m-6-6 6 6-6 6"/>',
  link:'<path d="m8 12 4-4M7 14l-1 1a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m0 6a3 3 0 0 0 4 0l4-4a3 3 0 0 0-4-4l-1 1"/>'
}[name]}</svg>`;

function renderArchivePage(){
  document.body.classList.add('archive-view');
  const fields=['author','place','theme','region','tag','time'];
  const state=Object.fromEntries(fields.map(name=>[name,params.get(name)||'']));
  state.author=state.author==='friend'?'friend':'kai';
  selection=filterPhotos(state);
  const optionList=(items,first,selected)=>`<option value="">${first}</option>${items.map(value=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(value==='pending'?'未标记日期':value)}</option>`).join('')}`;
  const list=(name)=>[...new Set(filterPhotos({author:state.author}).flatMap(p=>name==='tag'?p.tags||[]:p[name]||[]))];
  const english=Object.fromEntries(Object.entries(site.journeys).map(([place,c])=>[place,c.en]));
  $('main').innerHTML=`<header class="page-head a-head"><div><h1>所見 <span>Collected light</span></h1><p id="archive-intro"></p></div><div class="a-collection"><strong id="archive-places"></strong><span id="archive-total"></span><a id="archive-series" href="chapters.html">旅行系列 ↗</a></div></header>
  <form id="archive-filter-form" class="a-filter-form" aria-label="作品筛选">
    <div class="a-filter-wrap"><div class="a-toolbar">
      <select name="place" hidden aria-label="地区">${optionList(list('place'),'全部地区',state.place)}</select>
      <select name="theme" hidden aria-label="主题">${optionList(categories.slice(0,3).map(c=>c.theme),'全部主题',state.theme)}</select>
      <div class="a-themes" role="group" aria-label="题材"><span class="a-lens" aria-hidden="true"></span>${[['','全部'],...categories.slice(0,3).map(c=>[c.theme,c.name])].map(([value,label])=>`<button type="button" data-theme="${value}" aria-pressed="${value===state.theme}">${label}</button>`).join('')}</div>
      <span class="a-divider" aria-hidden="true"></span><button type="button" id="archive-place-trigger" class="a-place-trigger" aria-expanded="false" aria-controls="archive-place-options">${galleryIcon('pin')}<span>所有地点</span>${galleryIcon('chevron')}</button>
      <button type="button" id="archive-more" class="a-more" aria-expanded="false" aria-controls="archive-extra">${galleryIcon('filter')}筛选</button>
    </div><div id="archive-place-options" class="a-place-options" role="group" aria-label="选择地区" hidden inert></div></div>
    <div id="archive-extra" class="a-extra" hidden><label>摄影者<select name="author">${authorOptions(state.author)}</select></label><label id="archive-region-field">地点<select name="region"></select></label><label>画面<select name="tag"></select></label><label>时间<select name="time"></select></label></div>
  </form><div class="a-results"><p class="archive-summary" id="archive-summary" role="status"></p><button type="button" id="archive-clear" hidden>${galleryIcon('close')}清除筛选</button></div>
  <div class="a-active-filters" id="archive-active-filters"></div><div class="archive-grid"></div><p class="archive-empty" hidden>暂无符合条件的照片。可以清除筛选，或选择其他地点与主题。</p>${footer()}`;
  const form=$('archive-filter-form'),grid=document.querySelector('.archive-grid'),themes=form.querySelector('.a-themes');
  const trigger=$('archive-place-trigger'),picker=$('archive-place-options');
  let closeTimer,layoutFrame=0;
  function value(name){return form.elements.namedItem(name).value;}
  function setValue(name,next){form.elements.namedItem(name).value=next;}
  function currentState(){return Object.fromEntries(fields.map(name=>[name,value(name)]));}
  function packPhotos(){
    cancelAnimationFrame(layoutFrame);
    layoutFrame=requestAnimationFrame(()=>{
      const spans=[...grid.children].map(item=>[item,Math.ceil(item.getBoundingClientRect().height)]);
      spans.forEach(([item,height])=>{const span='span '+height;if(item.style.gridRowEnd!==span)item.style.gridRowEnd=span;});
    });
  }
  function moveLens(){const selected=themes.querySelector('[aria-pressed="true"]');if(selected){themes.style.setProperty('--lens-left',selected.offsetLeft+'px');themes.style.setProperty('--lens-width',selected.offsetWidth+'px');}}
  function closePlaces(restore=false){
    clearTimeout(closeTimer);picker.classList.remove('open');picker.inert=true;trigger.setAttribute('aria-expanded','false');
    if(restore)trigger.focus();closeTimer=setTimeout(()=>{picker.hidden=true;},250);
  }
  function refreshOptions(){
    const author=value('author'),pool=filterPhotos({author}),place=value('place');
    const places=[...new Set(pool.map(p=>p.place))],regions=[...new Set(filterPhotos({author,place}).map(p=>p.region).filter(r=>r&&r!==place))];
    const tags=[...new Set(pool.flatMap(p=>p.tags||[]))],times=[...new Set(pool.map(p=>p.time))].sort();
    for(const [name,items,first] of [['place',places,'全部地区'],['region',regions,'全部地点'],['tag',tags,'全部特色'],['time',times,'全部时间']]){
      const control=form.elements.namedItem(name),saved=control.value;
      control.innerHTML=optionList(items,first,saved);
      if(saved&&!items.includes(saved)){control.add(new Option(saved==='pending'?'未标记日期':saved,saved));control.value=saved;}
    }
    $('archive-region-field').hidden=!regions.length&&!value('region');
    picker.innerHTML=[['','所有地点'],...places.map(place=>[place,place])].map(([place,label])=>`<button type="button" data-place="${esc(place)}" aria-pressed="${place===value('place')}"><span><strong>${esc(label)}</strong>${english[place]?`<small>${english[place]}</small>`:''}</span>${galleryIcon('check')}</button>`).join('');
  }
  function paint(initial=false,push=true){
    const selected=currentState(),pool=filterPhotos({author:selected.author}),real=pool.some(p=>p.real);
    selection=filterPhotos(selected);
    if(!initial)pageSelection=selection;
    grid.innerHTML=selection.map(p=>`<div>${photoButton(p,'','archive')}<p class="archive-caption"><span>${esc(p.real?p.title:p.label)}</span><span>${esc(p.region||p.theme)} / ${authorName(p.author)}${p.real?'':' · 作品预留'}</span></p></div>`).join('');
    $('archive-intro').textContent=real?'在途中，也在日常。':'暂无已上传作品';
    const coveredPlaces=[...new Set(pool.map(p=>p.place))];$('archive-places').textContent=coveredPlaces.length>3?coveredPlaces.slice(0,3).join(' · ')+' 等 '+coveredPlaces.length+' 地':coveredPlaces.join(' · ');
    $('archive-total').textContent=real?`${authorName(selected.author)} / ${pool.length} frames`:`${authorName(selected.author)} / ${pool.length} 处作品预留`;
    $('archive-series').href='chapters.html?'+new URLSearchParams({author:selected.author});
    $('archive-summary').textContent=`显示 ${selection.length} 张 · 点击后循环观看${real?' '+authorName(selected.author)+' 的全部 '+pool.length+' 张照片':'该摄影者的全部参考位置'}`;
    $('archive-active-filters').textContent=[selected.region,selected.tag,selected.time==='pending'?'未标记日期':selected.time].filter(Boolean).join(' / ');
    $('archive-clear').hidden=!fields.slice(1).some(name=>selected[name]);
    document.querySelector('.archive-empty').hidden=!!selection.length;
    themes.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.theme===selected.theme)));
    trigger.querySelector('span').textContent=selected.place||'所有地点';
    picker.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.place===selected.place)));
    document.title=(selected.place||'所見')+'｜'+site.brand.title;
    bindPhotos();packPhotos();requestAnimationFrame(moveLens);
    if(!initial){
      grid.classList.remove('a-changing');void grid.offsetWidth;grid.classList.add('a-changing');
      if(push){const query=new URLSearchParams(Object.entries(selected).filter(([,value])=>value));history.pushState(null,'','works.html?'+query);}
    }
  }
  setValue('author',state.author);refreshOptions();
  for(const name of fields){if(state[name]&&!form.elements.namedItem(name).querySelector(`option[value="${CSS.escape(state[name])}"]`))form.elements.namedItem(name).add(new Option(state[name],state[name]));setValue(name,state[name]);}
  refreshOptions();paint(true);
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('change',e=>{
    if(e.target.name==='author')fields.slice(1).forEach(name=>setValue(name,''));
    if(e.target.name==='place')setValue('region','');
    refreshOptions();paint();
  });
  themes.addEventListener('click',e=>{const button=e.target.closest('button[data-theme]');if(!button)return;setValue('theme',button.dataset.theme);closePlaces();paint();});
  trigger.addEventListener('click',e=>{
    if(trigger.getAttribute('aria-expanded')==='true'){closePlaces();return;}
    clearTimeout(closeTimer);picker.hidden=false;picker.inert=false;trigger.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>picker.classList.add('open'));
    if(e.detail===0)(picker.querySelector('[aria-pressed="true"]')||picker.querySelector('button')).focus();
  });
  picker.addEventListener('click',e=>{const button=e.target.closest('button[data-place]');if(!button)return;setValue('place',button.dataset.place);setValue('region','');refreshOptions();paint();closePlaces(true);});
  $('archive-clear').onclick=()=>{fields.slice(1).forEach(name=>setValue(name,''));refreshOptions();paint();};
  $('archive-more').onclick=()=>{const panel=$('archive-extra');panel.hidden=!panel.hidden;$('archive-more').setAttribute('aria-expanded',String(!panel.hidden));closePlaces();};
  document.addEventListener('pointerdown',e=>{if(!picker.contains(e.target)&&!trigger.contains(e.target))closePlaces();});
  document.addEventListener('focusin',e=>{if(!picker.contains(e.target)&&!trigger.contains(e.target))closePlaces();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&trigger.getAttribute('aria-expanded')==='true'){e.preventDefault();closePlaces(true);}
    if(picker.contains(e.target)&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
      e.preventDefault();const buttons=[...picker.querySelectorAll('button')];let index=buttons.indexOf(document.activeElement);
      index=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[index].focus();
    }
  });
  window.addEventListener('popstate',()=>{
    const query=new URLSearchParams(location.search),requested=photos.find(photo=>photo.id===query.get('photo'));
    if($('lightbox').open&&!requested){photoReturnURL=location.href;$('lightbox').close();}
    setValue('author',query.get('author')==='friend'?'friend':'kai');
    fields.slice(1).forEach(name=>setValue(name,''));refreshOptions();
    for(const name of fields.slice(1)){const next=query.get(name)||'',control=form.elements.namedItem(name);if(next&&![...control.options].some(option=>option.value===next))control.add(new Option(next,next));control.value=next;}
    refreshOptions();closePlaces();paint(false,false);
    if(requested){
      const returnURL=new URL(location.href);returnURL.searchParams.delete('photo');photoReturnURL=returnURL.href;
      selection=photos.filter(photo=>photo.author===requested.author&&(!requested.real||photo.real));
      photoIndex=selection.findIndex(photo=>photo.id===requested.id);showPhoto();
    }
  });
  const toolbar=form.querySelector('.a-toolbar');let lightFrame;
  toolbar.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced)return;cancelAnimationFrame(lightFrame);lightFrame=requestAnimationFrame(()=>{const box=toolbar.getBoundingClientRect();toolbar.style.setProperty('--shine',Math.round((e.clientX-box.left)/box.width*100)+'%');});});
  toolbar.addEventListener('pointerleave',()=>{cancelAnimationFrame(lightFrame);toolbar.style.removeProperty('--shine');});
  grid.addEventListener('load',packPhotos,true);grid.addEventListener('error',packPhotos,true);
  new ResizeObserver(packPhotos).observe(grid);
  window.addEventListener('resize',()=>{closePlaces();moveLens();packPhotos();});
  document.fonts.ready.then(()=>{moveLens();packPhotos();});
}

document.addEventListener('DOMContentLoaded',()=>{
  $('contact-sheet').setAttribute('aria-labelledby','sheet-title');
  $('lightbox').setAttribute('aria-labelledby','lightbox-credit');$('photo-info-toggle').setAttribute('aria-controls','photo-info');
  $('photo-prev').innerHTML=galleryIcon('prev');$('photo-next').innerHTML=galleryIcon('next');
  $('photo-close').innerHTML=galleryIcon('close')+'<span>关闭</span>';$('photo-close').setAttribute('aria-label','关闭照片');
  $('photo-info-toggle').textContent='照片信息';
  $('copy-photo').innerHTML=galleryIcon('link')+'<span class="viewer-text">复制链接</span>';$('copy-photo').setAttribute('aria-label','复制照片链接');
  if(page==='series.html'&&document.querySelector('.editorial')){
    document.body.classList.add('series-page');
    const index=document.querySelector('.chapter-nav'),intro=document.querySelector('.series-intro');
    if(index&&intro){intro.after(index);index.classList.add('chapter-index');}
    const header=document.querySelector('.site-header');
    let headerFrame;
    const updateHeader=()=>{cancelAnimationFrame(headerFrame);headerFrame=requestAnimationFrame(()=>{const box=document.querySelector('.editorial').getBoundingClientRect();header.classList.toggle('on-paper',box.top<header.offsetHeight&&box.bottom>header.offsetHeight);});};
    window.addEventListener('scroll',updateHeader,{passive:true});window.addEventListener('resize',updateHeader);updateHeader();
  }
});
