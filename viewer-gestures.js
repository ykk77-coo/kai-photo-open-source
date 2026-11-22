(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.KaiPhotoGestures=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const limit=(n,min,max)=>Math.min(max,Math.max(min,n));
  function clamp(view,rect,size){
    const scale=limit(view.scale,1,2);
    const fit=Math.min(rect.width/size.width,rect.height/size.height);
    const x=Math.max(0,(size.width*fit*scale-rect.width)/2);
    const y=Math.max(0,(size.height*fit*scale-rect.height)/2);
    return {scale,x:limit(view.x,-x,x)||0,y:limit(view.y,-y,y)||0};
  }
  function zoom(view,scale,point,rect,size){
    const next=limit(scale,1,2),ratio=next/view.scale;
    return clamp({scale:next,x:point.x-(point.x-view.x)*ratio,y:point.y-(point.y-view.y)*ratio},rect,size);
  }
  function attach(el,options){
    let gesture=null,mouse=null;
    const prevent=e=>{if(e.cancelable)e.preventDefault();};
    const point=t=>({x:t.clientX,y:t.clientY});
    const distance=t=>Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY);
    const center=t=>{const r=options.rect();return {x:(t[0].clientX+t[1].clientX)/2-r.left-r.width/2,y:(t[0].clientY+t[1].clientY)/2-r.top-r.height/2};};
    const write=view=>options.write(clamp(view,options.rect(),options.size()));
    const startPinch=e=>{gesture={pinched:true,base:{...options.read()},distance:distance(e.touches),center:center(e.touches)};};
    el.ownerDocument?.addEventListener('touchstart',e=>{
      if(gesture&&e.touches.length>=2){prevent(e);startPinch(e);}
    },{capture:true,passive:false});
    el.addEventListener('touchstart',e=>{
      prevent(e);
      if(e.touches.length>=2){
        startPinch(e);
      }else if(e.touches.length===1){
        if(gesture?.pinched)return;
        gesture={pinched:false,start:point(e.touches[0]),last:point(e.touches[0]),base:{...options.read()}};
      }
    },{passive:false});
    el.addEventListener('touchmove',e=>{
      if(!gesture)return;
      prevent(e);
      if(e.touches.length>=2&&gesture.pinched&&gesture.distance>0){
        const scale=limit(gesture.base.scale*distance(e.touches)/gesture.distance,1,2);
        const ratio=scale/gesture.base.scale,next=center(e.touches);
        write({scale,x:next.x-(gesture.center.x-gesture.base.x)*ratio,y:next.y-(gesture.center.y-gesture.base.y)*ratio});
      }else if(e.touches.length===1&&!gesture.pinched){
        gesture.last=point(e.touches[0]);
        if(gesture.base.scale>1)write({...gesture.base,x:gesture.base.x+gesture.last.x-gesture.start.x,y:gesture.base.y+gesture.last.y-gesture.start.y});
      }
    },{passive:false});
    el.addEventListener('touchend',e=>{
      if(!gesture)return;
      prevent(e);
      if(e.touches.length)return; // A remaining finger after a pinch cannot become a swipe.
      const done=gesture;gesture=null;
      if(done.pinched)return;
      const end=e.changedTouches[0]?point(e.changedTouches[0]):done.last;
      const dx=end.x-done.start.x,dy=end.y-done.start.y;
      if(done.base.scale===1&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)options.onStep(dx<0?1:-1);
      else if(Math.hypot(dx,dy)<8)options.onTap();
    },{passive:false});
    el.addEventListener('touchcancel',()=>{gesture=null;});
    el.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.button!==0)return;
      mouse={start:{x:e.clientX,y:e.clientY},base:{...options.read()}};
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    el.addEventListener('pointermove',e=>{
      if(!mouse||e.pointerType!=='mouse'||mouse.base.scale===1)return;
      write({...mouse.base,x:mouse.base.x+e.clientX-mouse.start.x,y:mouse.base.y+e.clientY-mouse.start.y});
    });
    el.addEventListener('pointerup',e=>{
      if(!mouse||e.pointerType!=='mouse')return;
      const done=mouse;mouse=null;
      if(Math.hypot(e.clientX-done.start.x,e.clientY-done.start.y)<8)options.onTap();
    });
    el.addEventListener('pointercancel',()=>{mouse=null;});
    el.addEventListener('lostpointercapture',()=>{mouse=null;});
    return {reset(){gesture=null;mouse=null;}};
  }
  return {attach,clamp,zoom};
});
