// 只读取证：左上角标题是否已移除、三档视图按钮是否在左侧竖排、窄屏不溢出且可点击。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const PLUGIN='file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const ROOT='C:/Users/ZhongKe/Desktop/Design';
const OUT=ROOT+'/.design-suite';
const SHOTS=OUT+'/shots-ui';
const EXE='C:/Program Files/Google/Chrome/Application/chrome.exe';
await mkdir(SHOTS,{recursive:true});
const server=createServer(async(req,res)=>{try{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(await readFile(ROOT+'/index.html'));}catch{res.writeHead(404).end('nf');}});
await new Promise(r=>server.listen(8814,'127.0.0.1',r));
const profile=await mkdtemp(path.join(os.tmpdir(),'ds-ui-'));
const browser=await startBrowser(EXE,profile);
const target=await createPage(browser.port);
const client=new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable'); await client.send('Runtime.enable');
const ev=async(e)=>{const r=await client.send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r?.result?.value;};
const VIEWPORTS=[[320,568],[390,844],[768,1024],[1440,1000],[1920,1080]];
const out=[];
for(const [w,h] of VIEWPORTS){
  await client.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});
  await client.send('Page.navigate',{url:'http://127.0.0.1:8814/index.html'});
  for(let i=0;i<240;i++){if(await ev('document.getElementById("loader").getAttribute("data-done")==="true"').catch(()=>false))break;await delay(150);}
  await delay(700);
  const info=await ev(`(() => {
    const R=(s)=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect();return {l:Math.round(r.left),t:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),b:Math.round(r.bottom),r:Math.round(r.right)};};
    const bar=document.querySelector('#view-switch-bar');
    const btns=Array.from(document.querySelectorAll('.view-btn'));
    const btnInfo=btns.map(b=>{const r=b.getBoundingClientRect();const el=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+r.height/2));return {text:(b.textContent||'').trim(),w:Math.round(r.width),h:Math.round(r.height),hit:el?el.tagName:'none',hitIsBtn: !!(el&&el.closest&&el.closest('.view-btn'))};});
    return {
      titleblock: !!document.querySelector('.titleblock'),
      h1Text: !!document.querySelector('h1'),
      bar: R('#view-switch-bar'), barDir: getComputedStyle(bar).flexDirection,
      btnCount: btns.length, btnInfo,
      hud: R('#hud'), poem: R('#poem-card'), note: R('.concept-note'),
      vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight,
      scrollW: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      errors: (window.__DESIGN_SUITE_STATIC_ERRORS__||[]).length
    };
  })()`);
  const shot=await client.send('Page.captureScreenshot',{format:'png'});
  await writeFile(path.join(SHOTS,`ui-${w}x${h}.png`),Buffer.from(shot.data,'base64'));
  out.push(Object.assign({vp:`${w}x${h}`},info));
  const overlap=(a,b)=> a&&b ? !(a.r<=b.l||b.r<=a.l||a.b<=b.t||b.b<=a.t) : false;
  console.log(info.vp||`${w}x${h}`, '| 标题块',info.titleblock,'| h1',info.h1Text,'| 竖排',info.barDir,'| 按钮',info.btnCount,
    '| bar',JSON.stringify(info.bar),'| 与HUD重叠',overlap(info.bar,info.hud),'| 溢出',info.scrollW>info.vw,'| 按钮可点',info.btnInfo.every(b=>b.hitIsBtn),'| 错误',info.errors);
}
await writeFile(OUT+'/ui-left-evidence.json',JSON.stringify(out,null,2)+'\n','utf8');
console.log('DONE');
try{client.close();}catch{}
await stopBrowser(browser.child); await rm(profile,{recursive:true,force:true}); server.close(); process.exit(0);
