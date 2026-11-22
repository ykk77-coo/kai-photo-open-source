(() => {
  const compass='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="25"/><circle cx="32" cy="32" r="17"/><path d="M32 3v10M32 51v10M3 32h10M51 32h10M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6"/><path class="compass-needle" d="M32 16l6 22-6-4-6 4z"/><text x="32" y="11">N</text></svg>';
  if(page==='journey.html'&&feature('map'))renderAtlas(compass);
  if(!reference){const english=categories.map(c=>c.en);document.querySelectorAll('.index-title').forEach((title,i)=>{const label=document.createElement('span');label.className='index-label';title.replaceWith(label);label.append(title);const subtitle=document.createElement('span');subtitle.className='index-english';subtitle.textContent=english[i];subtitle.setAttribute('aria-hidden','true');label.append(subtitle);});}
  // Small original line ornaments, separate from the photography itself.
  document.querySelectorAll('.page-head,.about-hero').forEach(head=>{const mark=document.createElement('div');mark.className='editorial-mark';mark.innerHTML=compass;mark.setAttribute('aria-hidden','true');head.append(mark);});
  const glassTargets=document.querySelectorAll('.morph-dropdown,.mobile-nav,.atlas-toolbar,.atlas-selection,.menu-thumbnail,.desktop-nav #mode-toggle');
  glassTargets.forEach(element=>{
    element.classList.add('liquid-glass');let frame=0;
    element.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=element.getBoundingClientRect();element.style.setProperty('--glass-x',((e.clientX-r.left)/r.width*100)+'%');element.style.setProperty('--glass-y',((e.clientY-r.top)/r.height*100)+'%');element.style.setProperty('--glass-light','1');});});
    element.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);element.style.setProperty('--glass-light','0');});
    element.addEventListener('pointerdown',e=>{const button=e.target.closest('button,a');if(!button||!element.contains(button)||button.disabled)return;const bounds=button.getBoundingClientRect();button.classList.add('glass-press');const ripple=document.createElement('span');ripple.className='glass-ripple';ripple.style.left=(e.clientX-bounds.left)+'px';ripple.style.top=(e.clientY-bounds.top)+'px';ripple.setAttribute('aria-hidden','true');button.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});setTimeout(()=>{button.classList.remove('glass-press');ripple.remove();},650);});
  });
})();
