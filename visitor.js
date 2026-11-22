// Public navigation: direct routes; the existing dialog becomes Works' optional browser.
(()=>{
  const opener=$('menu-open'),directory=$('menu'),mobile=matchMedia('(max-width:760px)');
  let animation=null,closing=false;
  if(page==='works.html'){
    opener.textContent='更多浏览';opener.className='browse-opener';opener.setAttribute('aria-controls','menu');
    document.querySelector('.a-head').append(opener);
    $('archive-series').hidden=true;
  }
  directory.addEventListener('close',()=>{if(page==='works.html')opener.focus({preventScroll:true});});
  function close(){
    if(!directory.open||closing)return;
    if(reduced||!mobile.matches||!directory.animate){directory.close();return;}
    closing=true;animation=directory.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(10px) scale(.99)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
    const active=animation;active.finished.then(()=>{if(animation!==active)return;directory.close();closing=false;animation=null;},()=>{});
  }
  $('menu-close').onclick=close;
  directory.addEventListener('cancel',e=>{e.preventDefault();close();});
  directory.addEventListener('click',e=>{if(e.target.closest('a'))directory.close();});
  mobile.addEventListener('change',()=>{animation?.cancel();animation=null;closing=false;if(directory.open)directory.close();});
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
  const homeElement=document.querySelector('.home');
  if(homeElement&&!readSession('kai-hero-entered')){homeElement.classList.add('hero-enter');writeSession('kai-hero-entered','1');}
})();
