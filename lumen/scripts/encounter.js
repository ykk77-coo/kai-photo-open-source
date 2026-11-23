(()=>{
  const bag=KaiEncounterBag.create({getStorage:()=>sessionStorage});
  const box=$('lightbox');
  const shuffle='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h3c4 0 4 10 8 10h3m-3-3 3 3-3 3M3 15h3c1.5 0 2.4-1.2 3.1-3M11 8c.9-1.9 1.9-3 3-3h3m-3-3 3 3-3 3"/></svg>';
  let current=null,chanceId='',returnToMenu=false,entry,again,journey;
  const menuAuthor=()=>new URLSearchParams(location.search).get('author')==='friend'?'friend':'kai';
  function renderMenu(){
    if(!entry)return;
    const available=photos.some(p=>p.real&&p.author===menuAuthor());
    $('encounter-open').disabled=!available;$('encounter-availability').hidden=available;
  }
  function updateViewer(photo){
    current=photo;
    if(!again)return;
    if(!photo?.real){again.remove();journey.remove();return;}
    if(chanceId===photo.id){
      journey.href='series.html?'+new URLSearchParams({place:photo.place,author:photo.author});
      $('viewer-more-panel').appendChild(journey);
    }else{chanceId='';journey.remove();}
    $('viewer-more-panel').appendChild(again);
  }
  function encounter(author){
    const photo=bag.draw(author,photos,box.open?current?.id:'');
    if(!photo){renderMenu();return;}
    if(!box.open){
      photoReturnURL=location.href;returnToMenu=$('menu').open;
      if(returnToMenu)$('menu').close();
    }
    chanceId=photo.id;
    selection=photos.filter(p=>p.real&&p.author===photo.author);
    photoIndex=selection.findIndex(p=>p.id===photo.id);
    showPhoto();
    $('photo-close').focus({preventScroll:true});
  }
  document.addEventListener('kai:photo-change',e=>updateViewer(e.detail.photo));
  document.addEventListener('kai:viewer-ready',()=>{
    again=document.createElement('button');again.type='button';again.id='encounter-again';
    again.innerHTML=shuffle+'<span>再偶遇</span>';again.onclick=()=>{if(current?.real)encounter(current.author);};
    journey=document.createElement('a');journey.id='encounter-journey';
    journey.innerHTML=galleryIcon('next')+'<span>进入这段旅程</span>';
    if(box.open)updateViewer(selection[photoIndex]);
  });
  document.addEventListener('DOMContentLoaded',()=>{
    entry=document.createElement('section');entry.id='encounter-entry';entry.className='encounter-entry';
    entry.innerHTML=`<button id="encounter-open" type="button" aria-describedby="encounter-availability"><span class="encounter-copy">偶遇一张 <small lang="en">A chance encounter</small></span>${galleryIcon('next')}</button><p id="encounter-availability" hidden>当前摄影者暂无真实作品</p>`;
    $('menu-rows').before(entry);renderMenu();
    $('encounter-open').onclick=()=>encounter(menuAuthor());
    for(const id of ['menu-open','mobile-menu'])$(id).addEventListener('click',renderMenu);
    box.addEventListener('close',()=>{
      chanceId='';again?.remove();journey?.remove();
      const back=returnToMenu;returnToMenu=false;
      if(back){openMenu();renderMenu();$('encounter-open').focus({preventScroll:true});}
    });
  });
})();
