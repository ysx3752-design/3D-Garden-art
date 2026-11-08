import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const PLUGIN='file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const OUT='C:/Users/ZhongKe/Desktop/Design/.design-suite';
const server=createServer(async(req,res)=>{try{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(await readFile(OUT+'/verify-gate.html'));}catch{res.writeHead(404).end('nf');}});
await new Promise(r=>server.listen(8784,'127.0.0.1',r));
const profile=await mkdtemp(path.join(os.tmpdir(),'ds-pick-'));
const browser=await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe',profile);
const target=await createPage(browser.port);
const client=new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable'); await client.send('Runtime.enable');
const ev=async(e)=>{const r=await client.send('Runtime.evaluate',{expression:e,returnByValue:true});return r?.result?.value;};
await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await client.send('Page.navigate',{url:'http://127.0.0.1:8784/verify-gate.html'});
for(let i=0;i<200;i++){if(await ev('document.getElementById("loader").getAttribute("data-done")==="true"').catch(()=>false))break;await delay(150);}
await delay(600);
console.log('camera', JSON.stringify(await ev('window.__dbgInfo()')));
for(const p of [[0,0.9],[0,0],[0,-0.9],[-0.9,-0.9],[0.9,0.9],[0,-0.5]]){
  console.log('pick',p,JSON.stringify(await ev(`window.__dbgPick(${p[0]},${p[1]})`)));
}
try{client.close();}catch{}
await stopBrowser(browser.child); await rm(profile,{recursive:true,force:true}); server.close(); process.exit(0);
