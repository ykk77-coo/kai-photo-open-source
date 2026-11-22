/* Browser-local reading position; no history list and no network requests. */
window.KaiReadingBookmarks={create({getStorage,photos,essays,baseURL}){
  const base=new URL(baseURL),pages=['index.html','v2.html','works.html','chapters.html','series.html','journey.html','about.html','reference.html'];
  const key=author=>'kai:reading:'+author+':v1';
  function normalize(record,author){
    if(!record||record.version!==1||record.author!==author)return null;
    const photo=photos.find(p=>p.id===record.photoId&&p.author===author&&p.real);
    if(!photo||typeof record.url!=='string')return null;
    let url;try{url=new URL(record.url,base);}catch{return null;}
    if(url.origin!==base.origin||url.pathname.slice(0,url.pathname.lastIndexOf('/')+1)!==base.pathname.slice(0,base.pathname.lastIndexOf('/')+1))return null;
    const rawPage=url.pathname.split('/').pop()||'index.html',page=rawPage.includes('.')?rawPage:rawPage+'.html';if(!pages.includes(page))return null;
    if(page==='series.html'&&url.searchParams.has('essay')&&!essays.some(e=>e.id===url.searchParams.get('essay')&&e.author===author&&e.photoIds.every(id=>photos.some(p=>p.id===id&&p.author===author&&p.real))))return null;
    url.searchParams.set('author',author);url.searchParams.set('photo',photo.id);
    const anchor=photos.find(p=>p.id===record.anchorId&&p.author===author&&p.real);
    return {version:1,author,photoId:photo.id,url:page+url.search+url.hash,
      scrollY:Number.isFinite(record.scrollY)?Math.max(0,record.scrollY):0,
      anchorId:anchor?.id||'',anchorIndex:Number.isInteger(record.anchorIndex)?Math.max(0,record.anchorIndex):0,
      anchorTop:Number.isFinite(record.anchorTop)?record.anchorTop:0};
  }
  return {
    read(author){try{return normalize(JSON.parse(getStorage().getItem(key(author))),author);}catch{return null;}},
    save(photoId,position){const photo=photos.find(p=>p.id===photoId&&p.real);if(!photo)return false;
      const record=normalize({...position,version:1,photoId,author:photo.author},photo.author);if(!record)return false;
      try{getStorage().setItem(key(photo.author),JSON.stringify(record));return true;}catch{return false;}},
    clear(author){try{getStorage().removeItem(key(author));return true;}catch{return false;}}
  };
}};
