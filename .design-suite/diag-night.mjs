import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const PLUGIN='file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const OUT='C:/Users/ZhongKe/Desktop/Design/.design-suite';
const EXE='C:/Program Files/Google/Chrome/Application/chrome.exe';
const html=await readFile('C:/Users/ZhongKe/Desktop/Design/index.html','utf8');
const hook=`
  window.__setP = function (k, v) { params[k] = v; applyParams(); };
  window.__ssao = function (on) { if (window.setSSAO) window.setSSAO(on); };
  window.__stats2 = function (dataUrl) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
        var d = g.getImageData(0, 0, c.width, c.height).data, sum = 0, n = 0, dark = 0;
        for (var i = 0; i < d.length; i += 4 * 11) { var l = 0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]; sum += l; n++; if (l < 15) dark++; }
        resolve({ mean: +(sum/n).toFixed(1), dark: +(dark/n).toFixed(3) });
      };
      im.src = dataUrl;
    });
  };
`;
const tag='<script data-static-export-source="app.js">';
const a0=html.indexOf(tag), a1=html.indexOf('</script>',a0);
const blk=html.slice(a0,a1); const ti=blk.lastIndexOf('})();');
const verify=html.slice(0,a0)+blk.slice(0,ti)+hook+blk.slice(ti)+html.slice(a1);
await writeFile(OUT+'/verify-diag.html', verify,'utf8');
const server=createServer(async(req,res)=>{try{res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(await readFile(OUT+'/verify-diag.html'));}catch{res.writeHead(404).end('nf');}});
await new Promise(r=>server.listen(8797,'127.0.0.1',r));
const profile=await mkdtemp(path.join(os.tmpdir(),'ds-diag-'));
const browser=await startBrowser(EXE,profile);
const target=await createPage(browser.port);
const client=new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable'); await client.send('Runtime.enable');
const ev=async(e)=>{const r=await client.send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r?.result?.value;};
await client.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await client.send('Page.navigate',{url:'http://127.0.0.1:8797/verify-diag.html'});
for(let i=0;i<220;i++){if(await ev('document.getElementById("loader").getAttribute("data-done")==="true"').catch(()=>false))break;await delay(150);}
await delay(700);
await ev("document.querySelector('button[data-time=\"night\"]').click()");
await delay(1600);
async function measure(label){
  const r=await client.send('Page.captureScreenshot',{format:'jpeg',quality:70});
  const st=await ev(`window.__stats2('data:image/jpeg;base64,'+${JSON.stringify(r.data)})`);
  console.log(label, JSON.stringify(st));
}
await measure('night baseline');
await ev('window.__ssao(false)'); await delay(600); await measure('night SSAO off');
await ev('window.__ssao(true)'); await delay(400);
await ev('window.__setP("ambient", 1.0)'); await delay(400); await measure('night ambient 1.0');
await ev('window.__setP("ambient", 0.44); window.__setP("hemi", 2.2)'); await delay(400); await measure('night hemi 2.2');
await ev('window.__setP("hemi", 1.15); window.__setP("exposure", 1.9)'); await delay(400); await measure('night exposure 1.9');
console.log('DONE');
try{client.close();}catch{}
await stopBrowser(browser.child); await rm(profile,{recursive:true,force:true}); server.close(); process.exit(0);
