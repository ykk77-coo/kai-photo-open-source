window.KaiEncounterBag={create({getStorage,random=Math.random}){
  const memory=new Map();
  return {draw(author,photos,avoidId=''){
    const own=photos.filter(p=>p.real&&p.author===author),ids=[...new Set(own.map(p=>p.id))];
    if(!ids.length)return null;
    const key='kai:encounters:'+author+':v1';let saved=memory.get(author);
    if(!saved){try{saved=JSON.parse(getStorage().getItem(key));}catch{}}
    const valid=saved?.version===1&&Array.isArray(saved.remaining);
    const last=valid&&ids.includes(saved.last)?saved.last:'';
    let remaining=valid?[...new Set(saved.remaining)].filter(id=>ids.includes(id)&&id!==last):[];
    const newCycle=!remaining.length;if(newCycle)remaining=ids.slice();
    let eligible=newCycle&&remaining.length>1?remaining.filter(id=>id!==last):remaining;
    if(eligible.length>1)eligible=eligible.filter(id=>id!==avoidId);
    const chosen=eligible[Math.floor(random()*eligible.length)];
    const next={version:1,remaining:remaining.filter(id=>id!==chosen),last:chosen};
    memory.set(author,next);try{getStorage().setItem(key,JSON.stringify(next));}catch{}
    return own.find(p=>p.id===chosen);
  }};
}};
