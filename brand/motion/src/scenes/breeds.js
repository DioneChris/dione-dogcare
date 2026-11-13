const SCENE={render(t,f){
  const names=Object.keys(BREEDS); let s='';
  names.forEach((nm,i)=>{const col=i%3,row=Math.floor(i/3); const x=190+col*350,y=260+row*270;
    const d=dog(nm,{x,y,s:.95,gait:row%2?'trot':'walk',p:t+i*.13,t,collar:C.gold,bandana:i%4==1?C.olive:null});
    s+=shadow(x,y,110)+d.svg+`<text x="${x-120}" y="${y+34}" font-size="20" fill="#555">${nm}</text>`;});
  return defs(f)+`<rect width="${W}" height="${H}" fill="${C.paper}"/>`+rough(s)+grain();
}};
