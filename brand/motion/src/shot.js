const {chromium}=require('playwright');const path=require('path');
(async()=>{const [,,scene,out,...ts]=process.argv;const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1440}});
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text())});
await p.goto('file://'+path.resolve('stage.html')+'?scene='+scene);await p.waitForFunction('window.READY===true',{timeout:8000});
for(const t of ts){await p.evaluate(([t,f])=>renderAt(t,f),[+t,Math.round(+t*30)]);await p.screenshot({path:out.replace('%',t),type:'jpeg',quality:88});}
await b.close()})();
