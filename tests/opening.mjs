import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PORT='4195';
if(process.env.OPENING_DEV){const {createServer}=await import('vite');await (await createServer({server:{host:'127.0.0.1',port:4195,strictPort:true}})).listen();}else await import('../serve.mjs');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:.7,reducedMotion:'no-preference'});
page.setDefaultTimeout(90000);page.setDefaultNavigationTimeout(90000);
const dir='test-results/opening',errors=[],models=[];
page.on('request',request=>{if(/\.(glb|fbx)$/i.test(new URL(request.url()).pathname))models.push(request.url());});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(['error','warning'].includes(m.type()))console.log(m.text());});
await mkdir(dir,{recursive:true});
async function ready(i){await page.waitForFunction(index=>{const d=document.querySelector('.webgl-host')?.dataset;return d?.chapter===String(index)&&d.progress==='1.000' && d.athletes==='7';},i);}
try{
 // Observe the actual gate displacement submitted to WebGL, including while idle.
 await page.addInitScript(()=>{
   const gl=WebGL2RenderingContext.prototype,locations=new WeakSet();
   const lookup=gl.getUniformLocation,upload=gl.uniform1f;
   gl.getUniformLocation=function(program,name){
     const loc=lookup.call(this,program,name);
     if(name==='lift'&&loc)locations.add(loc);
     return loc;
   };
   gl.uniform1f=function(loc,value){
     if(loc&&locations.has(loc))window.gateLift=value;
     return upload.call(this,loc,value);
   };
 });
 await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
 await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
 const tick=async ms=>{await page.clock.fastForward(ms);await page.clock.runFor(100);};
 const read=()=>page.locator('.webgl-host').evaluate(el=>({...el.dataset,lift:window.gateLift}));
 await page.goto('http://127.0.0.1:4195/?quality=low#1');
 await tick(200);await tick(10000);
 const idle=await read();assert.equal(idle.phase,'4');assert.equal(idle.lift,0);
 await page.screenshot({path:dir+'/opening.png'});await page.locator('canvas').evaluate(c=>c.dataset.identity='rotunda');
 await page.locator('.rotunda-start').evaluate(button=>button.click());
 await tick(1000);
 const loading=await read();
 assert.ok(loading.lift>0);assert.equal(loading.camera.split(',')[2],idle.camera.split(',')[2]);
 await page.keyboard.press('ArrowRight');
 await tick(1810);
 const middle=await read(),[x,y,z]=middle.camera.split(',').map(Number);
 assert.equal(middle.chapter,'1');assert.ok(Math.abs(x)<2&&Math.abs(y-4.2)<1&&Math.abs(z-36)<7,JSON.stringify(middle));
 await tick(2000);await ready(1);
 await page.keyboard.press('ArrowLeft');await tick(2900);
 const closing=await read();assert.ok(closing.lift>0);assert.equal(closing.camera.split(',')[2],'77');
 await tick(2000);await ready(0);assert.equal((await read()).lift,0);
 await page.keyboard.press('Enter');await tick(200);assert.equal((await read()).lift,0);
 assert.equal(await page.locator('canvas').getAttribute('data-identity'),'rotunda');
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await tick(200);await page.screenshot({path:dir+'/mobile.png'});
 assert.ok(await page.locator('.rotunda-start').isVisible());assert.deepEqual(errors,[]);assert.deepEqual(models.map(url=>new URL(url).pathname),['/models/webkore-athlete.glb']);
 await writeFile(dir+'/results.json',JSON.stringify({middle,errors},null,2));console.log('PASS abertura, travelling, retorno e tela compacta');
}catch(e){console.error(e,errors,await page.locator(".performance-universe").getAttribute("data-renderer"));process.exitCode=1;}finally{await browser.close();process.exit(process.exitCode||0);}
