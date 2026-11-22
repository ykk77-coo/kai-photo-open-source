window.KaiAtlas={
 destination(region){const chapters=region?.authors.flatMap(a=>a.chapters)||[];return chapters.length===1?chapters[0].url:'';},
 summary(photos){return {count:photos.length,visited:new Set(photos.map(p=>String(p.provinceCode)).filter(code=>/^\d{6}$/.test(code)))};},
 region(code,photos,regions){
  const region=regions.find(r=>String(r.code)===String(code));if(!region)return null;
  const items=photos.filter(p=>String(p.provinceCode)===String(code)),preferred=window.PHOTO_SITE.map.covers[code];
  const cover=items.find(p=>p.image===preferred)||items[0]||null;
  const authors=Object.keys(window.PHOTO_SITE.authors).map(author=>{const own=items.filter(p=>p.author===author);return {author,count:own.length,chapters:[...new Set(own.map(p=>p.place))].map(place=>({place,count:own.filter(p=>p.place===place).length,url:'series.html?'+new URLSearchParams({place,author})}))};}).filter(a=>a.count);
  return {...region,count:items.length,cover,authors};
 }
};
