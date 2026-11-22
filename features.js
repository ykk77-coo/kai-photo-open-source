// All content remains in the public configuration; no account or remote AI service.
window.KAI_FIELD_NOTES=window.PHOTO_SITE.fieldNotes||{};
window.KAI_JOURNEY_LINKS=window.PHOTO_SITE.further||{};
document.addEventListener('DOMContentLoaded',()=>{
  if(!feature('map')){
    document.querySelectorAll('a[href^="journey.html"]').forEach(e=>e.remove());
    if(page==='journey.html')$('main').innerHTML='<section class="page-head"><h1>地区索引未启用</h1><p>可以从作品或旅行章节继续浏览。</p><a href="works.html">查看作品 ↗</a></section>'+footer();
  }
  if(!feature('secondAuthor')){
    document.querySelectorAll('a[href*="author=friend"],.atlas-friend-pending').forEach(e=>e.remove());
    document.querySelectorAll('select[name="author"]').forEach(e=>e.closest('label')?.remove());
  }
  function infoAvailability(photo){
    const useful=feature('metadata')||(feature('fieldNotes')&&typeof site.fieldNotes?.[photo?.id]==='string'&&site.fieldNotes[photo.id].trim());
    $('photo-info-toggle').hidden=!useful;
    if(!useful){$('photo-info').hidden=true;$('photo-info-toggle').setAttribute('aria-expanded','false');}
  }
  infoAvailability(selection[photoIndex]);
  document.addEventListener('kai:photo-change',e=>infoAvailability(e.detail.photo));
  const c=site.contact||{};
  for(const host of document.querySelectorAll('.home-footer,.about-footer')){
    const links=document.createElement('span');links.className='site-contact';
    if(c.email){const a=document.createElement('a');a.href='mailto:'+c.email;a.textContent=c.email;links.append(a);}
    if(c.socialUrl){const a=document.createElement('a');a.href=c.socialUrl;a.textContent=c.socialLabel||'个人主页 ↗';a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
    if(links.childElementCount)host.append(links);
  }
});
