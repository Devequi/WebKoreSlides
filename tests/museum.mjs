import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PORT='4193';
if(process.env.MUSEUM_DIST)await import('../serve.mjs');
else {const {createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4193,strictPort:true}});await server.listen();}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[],checks=[],poses={};
page.setDefaultTimeout(90000);page.setDefaultNavigationTimeout(90000);
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const dir='test-results/museum';await mkdir(dir,{recursive:true});
const data=()=>page.locator('.webgl-host').evaluate(e=>({...e.dataset}));
async function ready(index){await page.waitForFunction(i=>{const e=document.querySelector('.webgl-host');return e?.dataset.chapter===String(i)&&e.dataset.progress==='1.000';},index,{timeout:60000});await page.waitForFunction(()=>document.querySelectorAll('section.slide').length===1);}
async function go(i){await page.getByRole('button',{name:new RegExp(`^Ir ao slide ${i+1}:`)}).click();await ready(i);}
async function record(name){checks.push(name);console.log('PASS',name);await writeFile(`${dir}/results.json`,JSON.stringify({checks,errors,poses},null,2));}
try{
 await page.goto('http://127.0.0.1:4193/?quality=low#2');await ready(1);await page.locator('canvas').evaluate(e=>e.dataset.identity='museum');
 for(const width of [1366,1920]){
  await page.setViewportSize({width,height:width===1366?768:1080});
  for(const i of [1,2]){await go(i);await page.screenshot({path:`${dir}/${width}-scene-${i+1}.png`});
   const style=await page.addStyleTag({content:'.presentation main,.presentation .topbar,.presentation .bottom-bar{visibility:hidden!important}.performance-universe:after{display:none!important}'});
   await page.screenshot({path:`${dir}/${width}-scene-${i+1}-world.png`});await style.evaluate(e=>e.remove());poses[`${width}-${i}`]=await data();
   assert.equal(await page.locator('canvas').count(),1);assert.equal(await page.locator('canvas').getAttribute('data-identity'),'museum');
   const overflow=await page.locator('section.slide').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('h2,h3,p,.museum-note,.objective')].filter(x=>{const b=x.getBoundingClientRect();return b.width&&(b.left<r.left-2||b.right>r.right+2||b.bottom>r.bottom+2);}).map(x=>x.textContent);});assert.deepEqual(overflow,[]);
  }
 }await record('Duas cenas, duas resoluções, texto legível e capturas do mundo sem HTML');
 assert.notEqual(poses['1366-1'].pose,poses['1366-2'].pose);assert.notEqual(poses['1366-1'].camera,poses['1366-2'].camera);
 await page.setViewportSize({width:1366,height:768});await go(1);assert.equal((await data()).pose,poses['1366-1'].pose);await go(2);assert.equal((await data()).pose,poses['1366-2'].pose);await record('Retorno determinístico dos mesmos objetos e câmera');
 await page.emulateMedia({reducedMotion:'no-preference'});await go(1);const before=await data();await page.getByRole('button',{name:/^Ir ao slide 3:/}).click();
 await page.waitForFunction(()=>{const p=+document.querySelector('.webgl-host').dataset.progress;return p>.1&&p<.9;});const middle=await data();assert.notEqual(before.camera,middle.camera);assert.notEqual(before.pose,middle.pose);await page.screenshot({path:`${dir}/transition.png`});await ready(2);
 for(const i of [1,2,1,2])await page.getByRole('button',{name:new RegExp(`^Ir ao slide ${i+1}:`)}).click();await ready(2);assert.equal((await data()).pose,poses['1366-2'].pose);await record('Travelling, transformação física e navegação interrompida');
 poses.steadySamples=await page.evaluate(()=>new Promise(resolve=>{const el=document.querySelector('.webgl-host'),samples=[];let last=el.dataset.frames;const observer=new MutationObserver(()=>{if(last===el.dataset.frames)return;last=el.dataset.frames;samples.push({renderMs:+el.dataset.renderMs,drawCalls:+el.dataset.drawCalls,geometries:+el.dataset.geometries,textures:+el.dataset.textures});if(samples.length===12){observer.disconnect();resolve(samples);}});observer.observe(el,{attributes:true});}));await record('Amostras de custo e recursos coletadas após estabilizar a cena');
 await page.emulateMedia({reducedMotion:'reduce'});await go(1);const frames=(await data()).frames;await page.waitForTimeout(300);assert.equal((await data()).frames,frames);await record('Movimento reduzido encerra o loop');
 for(const i of [0,3,4,5,6,7,8,9,1,2]){await go(i);assert.equal(await page.locator('canvas').getAttribute('data-identity'),'museum');}await record('Os dez capítulos mantêm navegação e o mesmo canvas');
 await page.goto('http://127.0.0.1:4193/?noWebGL#2');await page.locator('.performance-universe.static').waitFor();assert.equal(await page.locator('canvas').count(),0);await page.screenshot({path:`${dir}/fallback.png`});await record('Fallback sem WebGL preserva conteúdo');
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4193/?quality=low#2');await ready(1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`${dir}/mobile.png`});await record('390 px sem overflow horizontal');
 assert.deepEqual(errors,[]);await record('Console sem erros');
}catch(e){console.error(e);console.error(errors);await page.screenshot({path:`${dir}/failure.png`});await writeFile(`${dir}/failure.txt`,e.stack+'\n'+JSON.stringify(errors));process.exitCode=1;}finally{await browser.close();process.exit(process.exitCode||0);}
