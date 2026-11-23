// The same browse dialog serves the desktop and mobile navigation.
const menuTriggers=[$('menu-open'),$('mobile-menu')],browseDialog=$('menu');
const browseMobile=matchMedia('(max-width:760px), (max-width:1000px) and (max-height:500px) and (orientation:landscape)');
const browseTrigger=()=>menuTriggers[Number(browseMobile.matches)];
function openMenu(){
  if(browseDialog.open)return;
  browseDialog.showModal();
  browseTrigger().setAttribute('aria-expanded','true');
  $('menu-close').focus({preventScroll:true});
}
(()=>{
  if(page==='works.html')$('archive-series').hidden=true;
  let animation=null;
  function close(){
    if(!browseDialog.open||animation)return;
    if(reduced||!browseMobile.matches||!browseDialog.animate){browseDialog.close();return;}
    animation=browseDialog.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(10px) scale(.99)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
    const active=animation;
    active.finished.then(()=>{if(animation===active)browseDialog.close();},()=>{});
  }
  for(const trigger of menuTriggers)trigger.onclick=openMenu;
  $('menu-close').onclick=close;
  browseDialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  browseDialog.addEventListener('click',e=>{if(e.target.closest('a'))browseDialog.close();});
  browseDialog.addEventListener('close',()=>{
    animation?.cancel();animation=null;
    for(const trigger of menuTriggers)trigger.setAttribute('aria-expanded','false');
    if(!$('lightbox').open)browseTrigger().focus({preventScroll:true});
  });
  browseMobile.addEventListener('change',()=>{if(browseDialog.open)browseDialog.close();});
  for(const nav of document.querySelectorAll('.desktop-nav,.mobile-nav')){
    for(const link of nav.querySelectorAll('a')){
      const route=link.getAttribute('href');
      if(route===page||(route==='works.html'&&['chapters.html','series.html'].includes(page)))link.setAttribute('aria-current','page');
    }
  }
  const mobileNav=document.querySelector('.mobile-nav'),desktopNav=document.querySelector('.desktop-nav');
  mobileNav.insertAdjacentHTML('afterbegin','<a href="index.html">首页</a>');
  if(page!=='index.html')desktopNav.insertAdjacentHTML('afterbegin','<a href="index.html">首页</a>');
  mobileNav.querySelector('a[href="index.html"]')?.setAttribute('aria-current',page==='index.html'?'page':'false');
})();
