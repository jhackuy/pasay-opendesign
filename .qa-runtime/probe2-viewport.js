const { spawnSync } = require('child_process');
const http = require('http');
const path = require('path');
const WebSocket = require('C:/Users/Admin/AppData/Roaming/Open Design/launcher/channels/stable/namespaces/release-stable-win/versions/0.21.0/payload/resources/app/node_modules/ws');
const OUT_DIR = __dirname;
const port = 9406;
spawnSync('powershell', ['-NoProfile','-ExecutionPolicy','Bypass','-File', path.join(OUT_DIR,'launch-chrome-cdp.ps1'), '-Port', String(port), '-Profile', path.join(OUT_DIR,'probe2-prof'), '-Width','430','-Height','900'], {encoding:'utf8'});
function jget(u){return new Promise((res,rej)=>{http.get(u,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d))}catch(e){rej(e)}})}).on('error',rej);});}
(async()=>{
  for(let i=0;i<50;i++){try{await jget('http://127.0.0.1:'+port+'/json/version');break}catch(e){await new Promise(r=>setTimeout(r,200));}}
  const list=await jget('http://127.0.0.1:'+port+'/json/list');
  const ws=new WebSocket('ws://127.0.0.1:'+port+'/devtools/page/'+list.find(t=>t.type==='page').id,{perMessageDeflate:false,maxPayload:256*1024*1024});
  let id=1;const pending=new Map();
  ws.on('message',raw=>{const m=JSON.parse(raw.toString());if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}});
  await new Promise(r=>ws.once('open',r));
  const send=(method,params)=>new Promise(r=>{const i=id++;pending.set(i,r);ws.send(JSON.stringify({id:i,method,params:params||{}}));});
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:430,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:8790/pasay-mini-app.html'});
  await new Promise(r=>setTimeout(r,6000));
  const probe=await send('Runtime.evaluate',{expression:`(function(){
    var out={};
    [{w:390},{w:430}].forEach(function(o){
      var de=document.documentElement, bd=document.body, app=document.getElementById('app');
      de.style.width=o.w+'px'; de.style.margin='0'; if(bd){bd.style.width=o.w+'px'; bd.style.margin='0'; bd.style.overflow='visible';}
      app.style.width=o.w+'px'; app.style.boxSizing='border-box';
      render && (location.hash='#/home');
      out['w'+o.w]={scrollW:document.documentElement.scrollWidth, clientW:document.documentElement.clientWidth, appClient:app.clientWidth, appScroll:app.scrollWidth, docOverflow:document.documentElement.scrollWidth>o.w, appOverflow:app.scrollWidth>(app.clientWidth+1)};
    });
    return out;
  })()`,returnByValue:true});
  console.log(JSON.stringify(probe.result.value,null,2));
  ws.close(); process.exit(0);
})().catch(e=>{console.error('ERR',e.message);process.exit(2);});
