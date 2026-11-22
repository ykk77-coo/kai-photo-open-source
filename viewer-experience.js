(()=>{
  'use strict';
  document.addEventListener('kai:viewer-ready',()=>{
    const box=$('lightbox'),panel=$('viewer-more-panel'),info=$('photo-info');
    const key='kai:viewer-frame:v1';
    let frame='dark';
    try{if(localStorage.getItem(key)==='paper')frame='paper';}catch{}
    if(feature('frames')){
    const chooser=document.createElement('div');chooser.className='viewer-frame';
    chooser.innerHTML='<span id="viewer-frame-label">画框 <small lang="en">Frame</small></span><div class="viewer-frame-options" role="radiogroup" aria-labelledby="viewer-frame-label"><button type="button" role="radio" data-frame="dark"><span class="frame-swatch frame-swatch-dark" aria-hidden="true"></span>暖黑</button><button type="button" role="radio" data-frame="paper"><span class="frame-swatch frame-swatch-paper" aria-hidden="true"></span>纸白</button></div>';
    panel.insertBefore(chooser,panel.firstChild);
    const choices=[...chooser.querySelectorAll('[data-frame]')];
    function apply(value,save=false){
      frame=value;box.dataset.frame=value;
      for(const choice of choices){const active=choice.dataset.frame===value;choice.setAttribute('aria-checked',String(active));choice.tabIndex=active?0:-1;}
      if(save)try{localStorage.setItem(key,value);}catch{}
    }
    for(const choice of choices){
      choice.addEventListener('click',()=>apply(choice.dataset.frame,true));
      choice.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
        e.preventDefault();e.stopPropagation();const other=choices.find(el=>el!==choice);apply(other.dataset.frame,true);other.focus();
      });
    }
    apply(frame);
    }
    function renderNote(photo){
      info.querySelector('.photo-field-notes')?.remove();
      const text=feature('fieldNotes')&&photo?.real&&window.KAI_FIELD_NOTES?.[photo.id];
      if(typeof text!=='string'||!text.trim())return;
      const details=document.createElement('details');details.className='photo-field-notes';
      const summary=document.createElement('summary');summary.innerHTML='照片背后 <span lang="en">Field notes</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg>';details.appendChild(summary);
      if(window.KAI_FIELD_NOTES_REVIEW===true){const label=document.createElement('small');label.className='field-notes-review';label.textContent='排版测试 · 非正式手记';details.appendChild(label);}
      const body=document.createElement('div');body.className='field-notes-text';
      for(const paragraph of text.trim().split(/\n\s*\n/)){const p=document.createElement('p');p.textContent=paragraph;body.appendChild(p);}
      details.appendChild(body);info.insertBefore(details,info.querySelector('.exif-list'));
    }
    document.addEventListener('kai:photo-change',e=>renderNote(e.detail.photo));
    if(box.open)renderNote(selection[photoIndex]);
  });
})();
