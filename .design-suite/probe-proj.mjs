import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const PLUGIN='file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const OUT='C:/Users/ZhongKe/Desktop/Design/.design-suite';
const server=createServer(async(req,res)=>{try{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(await readFile(OUT+'/verify-light.html'));}catch{res.writeHead(404).end('nf');}});
await new Promise(r=>server.listen(8796,'127.0.0.1',r));
const profile=await mkdtemp(path.join(os.tmpdir(),'ds-proj-'));
const browser=await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe',profile);
const target=await createPage(browser.port);
const client=new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable'); await client.send('Runtime.enable');
const ev=async(e)=>{const r=await client.send('Runtime.evaluate',{expression:e,returnByValue:true});return r?.result?.value;};
await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await client.send('Page.navigate',{url:'http://127.0.0.1:8796/verify-light.html'});
for(let i=0;i<220;i++){if(await ev('document.getElementById("loader").getAttribute("data-done")==="true"').catch(()=>false))break;await delay(150);}
await delay(800);
console.log('cam', JSON.stringify(await ev('({p:camera.position.toArray().map(n=>+n.toFixed(2)), t:controls.target.toArray().map(n=>+n.toFixed(2)), fov:camera.fov, aspect:+camera.aspect.toFixed(3)})')));
for(const [name,p] of Object.entries({'主殿墙面':[0,5,-2.6],'直廊廊面':[0,0.6,9],'湖面':[9,0.42,5],'草坪地面':[-26,0.05,9],'东侧花树':[25,2.4,12],'天空':[0,26,-60],'西院墙':[-37.9,2.2,4]})){
  console.log(name, JSON.stringify(await ev(`window.__dbgProj(${p[0]},${p[1]},${p[2]})`)));
}
console.log('canvas rect', JSON.stringify(await ev("(()=>{const r=document.getElementById('scene').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()")));
try{client.close();}catch{}
await stopBrowser(browser.child); await rm(profile,{recursive:true,force:true}); server.close(); process.exit(0);
