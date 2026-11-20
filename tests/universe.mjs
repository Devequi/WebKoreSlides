import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
process.env.PORT='4189';await import('../serve.mjs');
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:1366,height:768},reducedMotion:'reduce'}),page=await ctx.newPage();
const checks=[],errors=[],remote=[],overflow=[],poses=[],memory=[],transitions=[];let vite;
const lifecycleOnly=process.argv.includes('--lifecycle');
const directory=lifecycleOnly?'test-results/universe/lifecycle-check':'test-results/universe';await mkdir(directory,{recursive:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await ctx.route('**/*',route=>{if(new URL(route.request().url()).origin!=='http://127.0.0.1:4189'){remote.push(route.request().url());return route.abort();}return route.continue();});
await page.addInitScript(()=>{window.universePhases=[];new MutationObserver(()=>{const el=document.querySelector('.presentation');if(el&&!window.universePhases.includes(Number(el.dataset.arenaPhase)))window.universePhases.push(Number(el.dataset.arenaPhase));}).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['data-arena-phase']});});
const stages=[0,0,0,4,4,3,2,3,1,0];
const metrics=()=>page.locator('.webgl-host').evaluate(el=>({...el.dataset}));
async function ready(index,step){await page.waitForFunction(({index,step})=>{const e=document.querySelector('.webgl-host');return e?.dataset.chapter===String(index)&&(step===undefined||e.dataset.step===String(step))&&e.dataset.progress==='1.000';},{index,step},{timeout:20000});await page.waitForFunction(()=>document.querySelectorAll('section.slide').length===1);}
async function load(n=1,query='quality=low',settle=true){await page.goto(`http://127.0.0.1:4189/?${query}&qa=${Date.now()}#${n}`);await page.locator('section.slide').waitFor();if(settle)await ready(n-1,0);}
async function navigate(index,step){await page.getByRole('button',{name:new RegExp(`^Ir ao slide ${index+1}:`)}).click();await ready(index,step);}
async function arrow(key='ArrowRight'){await page.locator('.slide-heading h2,.hero h1').last().click();await page.keyboard.press(key);}
async function persist(){await writeFile(`${directory}/results.json`,JSON.stringify({checks,errors,remote,overflow,poses,memory,transitions},null,2));}
async function check(name,fn){if(lifecycleOnly&&!name.startsWith('Descarte real')&&!name.startsWith('Tela compacta'))return;await fn();checks.push(name);await persist();console.log('PASS',name);}
async function bounds(index,step,width,height){const problems=await page.locator('section.slide').evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('h1,h2,h3,p,button,.real-product,.cinematic-credits')].filter(e=>{if(e.closest('[aria-hidden=true]')||getComputedStyle(e).visibility==='hidden')return false;const b=e.getBoundingClientRect();return b.width&&b.height&&(b.left<r.left-2||b.right>r.right+2||b.bottom>r.bottom+2);}).map(e=>e.textContent.slice(0,90));});if(problems.length)overflow.push({index,step,width,height,problems});}
try{
 await check('Estados dos capítulos e canvas de viewport inteira nas duas resoluções',async()=>{
  for(const [width,height]of [[1366,768],[1920,1080]]){
   await page.setViewportSize({width,height});await load();await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.evaluate(()=>document.fonts.check('600 28px "Space Grotesk"')),true);
   assert.equal(await page.locator('.rotunda-title p').innerText(),'GERENCIAMENTO · TREINO · EVOLUÇÃO');
   const canvas=await page.locator('canvas').boundingBox();assert.deepEqual([Math.round(canvas.x),Math.round(canvas.y),Math.round(canvas.width),Math.round(canvas.height)],[0,0,width,height]);
   for(let i=0;i<10;i++){
    if(i)await navigate(i,0);
    for(let step=0;step<=stages[i];step++){if(step){await arrow();await ready(i,step);}await bounds(i,step,width,height);}
    await page.screenshot({path:`${directory}/${width}-chapter-${i+1}-final.png`});
   }
  }
  assert.deepEqual(overflow,[]);
 });
 await check('Dez cenários distintos, um renderer persistente e retorno reproduzível',async()=>{
  await page.setViewportSize({width:1366,height:768});await load();await page.locator('canvas').evaluate(el=>el.dataset.testIdentity='persistent');
  for(let i=0;i<10;i++){if(i)await navigate(i,0);const data=await metrics();poses.push({index:i,pose:data.pose,camera:data.camera});assert.equal(await page.locator('canvas').count(),1);assert.equal(await page.locator('canvas').getAttribute('data-test-identity'),'persistent');}
  assert.equal(new Set(poses.map(p=>p.camera)).size,10);assert.ok(new Set(poses.map(p=>p.pose)).size>=9);
  for(const i of [6,2,9,4,1,0]){await navigate(i,0);const data=await metrics();assert.equal(data.pose,poses[i].pose);assert.equal(data.camera,poses[i].camera);}
 });
 await check('Funcionalidades e quatro etapas da API comandam o mundo',async()=>{
  await load(5);const modes=[];for(let step=0;step<5;step++){if(step){await arrow();await ready(4,step);}modes.push(await metrics());assert.equal(await page.locator('.real-product>img').evaluate(img=>img.complete&&img.naturalWidth>0),true);if([2,3].includes(step))await page.screenshot({path:`${directory}/1366-feature-${step}.png`});}
  assert.equal(new Set(modes.map(p=>p.pose)).size,5);assert.equal(new Set(modes.map(p=>p.camera)).size,5);
  await load(6);const cameras=[];for(let step=0;step<4;step++){if(step){await arrow();await ready(5,step);}cameras.push((await metrics()).camera);}assert.equal(new Set(cameras).size,4);assert.match(await page.locator('.request-box [role=status]').innerText(),/200/);
 });
 await check('Introdução ativa, salto imediato e navegação durante a entrada',async()=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await load(1);await page.waitForFunction(()=>document.querySelector('.presentation').dataset.arenaPhase==='4');assert.deepEqual(await page.evaluate(()=>window.universePhases),[0,1,2,3,4]);
  await arrow('e');await page.waitForFunction(()=>Number(document.querySelector('.presentation').dataset.arenaPhase)<4);await arrow('Enter');await ready(0,0);assert.equal((await metrics()).phase,'4');
  await arrow('e');await page.getByRole('button',{name:'Pular abertura',exact:true}).click();await ready(0,0);
  await arrow('e');await page.waitForFunction(()=>Number(document.querySelector('.presentation').dataset.arenaPhase)<4);await arrow();await ready(1,0);assert.equal(new URL(page.url()).hash,'#2');
 });
 await check('Câmera e geometria percorrem uma transição real e aceitam interrupção',async()=>{
  const before=await metrics();await page.getByRole('button',{name:/^Ir ao slide 3:/}).click();
  await page.waitForFunction(()=>{const e=document.querySelector('.webgl-host');return e.dataset.chapter==='2'&&Number(e.dataset.progress)>.08&&Number(e.dataset.progress)<.9;});const middle=await metrics();await page.screenshot({path:`${directory}/transition-problem-solution.png`});await ready(2,0);const after=await metrics();
  assert.notEqual(middle.camera,before.camera);assert.notEqual(middle.camera,after.camera);assert.notEqual(middle.pose,after.pose);transitions.push({before,middle,after});
  for(const i of [8,3,6,1,9,4])await page.getByRole('button',{name:new RegExp(`^Ir ao slide ${i+1}:`)}).click();await ready(4);assert.equal(await page.locator('canvas').count(),1);
 });
 await check('Movimento ambiental ativo em todos os dez capítulos e parallax discreto',async()=>{
  for(let i=0;i<10;i++){await navigate(i);if(i===0){await arrow('Enter');await ready(0);}const frames=Number((await metrics()).frames);await page.waitForFunction(n=>Number(document.querySelector('.webgl-host').dataset.frames)>n,frames,{timeout:15000});}
  await navigate(2);const camera=(await metrics()).camera;await page.mouse.move(1330,100);await page.waitForFunction(value=>document.querySelector('.webgl-host').dataset.camera!==value,camera);await page.mouse.move(683,384);
 });
 await check('Recursos limitados e estáveis após aquecer todos os estados',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.webgl-host').dataset.motion==='still');await load();
  for(let i=0;i<10;i++){if(i)await navigate(i,0);for(let step=1;step<=stages[i];step++){await arrow();await ready(i,step);}}
  const baseline=await metrics();for(const i of [0,6,4,7,2,9,5,1,8,3,0,6,4,7,2,9,5,1,8,3]){await navigate(i);memory.push(await metrics());}
  const final=await metrics();assert.equal(final.geometries,baseline.geometries);assert.equal(final.textures,baseline.textures);assert.ok(Number(final.geometries)<=Number(final.geometryBudget)+1);assert.ok(memory.every(m=>Number(m.drawCalls)<=([0,1,2].includes(Number(m.chapter))?240:16)));
 });
 await check('Offline, capturas reais e fonte local em todos os capítulos',async()=>{
  await load();await ctx.setOffline(true);for(let i=0;i<10;i++)await navigate(i);await navigate(4);assert.equal(await page.locator('.real-product>img').evaluate(img=>img.complete&&img.naturalWidth>0),true);await ctx.setOffline(false);assert.deepEqual(remote,[]);
  const hash=buffer=>createHash('sha256').update(buffer).digest('hex');assert.equal(hash(await readFile('public/logo.png')),hash(await readFile('C:/Users/felip/Downloads/WebKore - Copia/Logo/logoWK.png')));
 });
 await check('Movimento reduzido finaliza a pose e encerra o loop',async()=>{
  await page.waitForFunction(()=>document.querySelector('.webgl-host').dataset.motion==='still');const a=(await metrics()).frames;await page.waitForTimeout(400);assert.equal((await metrics()).frames,a);await page.mouse.move(50,50);await page.waitForTimeout(150);assert.equal((await metrics()).frames,a);
 });
 await check('Fallback específico de cada capítulo e recuperação da navegação após perda do contexto',async()=>{
  await page.locator('canvas').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await page.locator('.universe-fallback').waitFor();assert.equal(await page.locator('canvas').count(),0);
  await load(1,'noWebGL',false);await page.locator('.universe-fallback').waitFor();for(let i=0;i<10;i++){await page.getByRole('button',{name:new RegExp(`^Ir ao slide ${i+1}:`)}).click();await page.waitForFunction(i=>document.querySelector('.universe-fallback').dataset.chapter===String(i),i);}await page.screenshot({path:`directory/fallback.png`.replace('directory',directory)});
 });
 await check('Descarte real de buffers, texturas, contexto e RAF em três ciclos',async()=>{
  await writeFile(`${directory}/lifecycle.jsx`,"import React from 'react';import{createRoot}from'react-dom/client';import{PerformanceUniverse}from'/src/components/PerformanceUniverse.jsx';let root;window.mountWorld=()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(PerformanceUniverse,{index:5,step:2,reduced:true}));};window.unmountWorld=()=>root.unmount();window.mountWorld();");
  vite=await createServer({server:{host:'127.0.0.1',port:4190,strictPort:true},plugins:[{name:'universe-lifecycle',configureServer(server){server.middlewares.use('/__world',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__world',`<html><head><style>.webgl-host{width:800px;height:450px}</style></head><body><div id="root"></div><script type="module" src="/${directory}/lifecycle.jsx"></script></body></html>`));});}}]});await vite.listen();
  const life=await browser.newPage();life.on('pageerror',e=>errors.push(e.message));await life.addInitScript(()=>{const pending=new Set(),raf=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);window.pendingWorldFrames=()=>pending.size;window.requestAnimationFrame=fn=>{const id=raf(t=>{pending.delete(id);fn(t);});pending.add(id);return id;};window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};window.gpu={deletedBuffers:0,deletedTextures:0,lost:0};for(const [name,key]of [['deleteBuffer','deletedBuffers'],['deleteTexture','deletedTextures']]){const original=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){window.gpu[key]++;return original.apply(this,args);};}const original=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){const ext=original.call(this,name);return name==='WEBGL_lose_context'&&ext?{loseContext:()=>{window.gpu.lost++;ext.loseContext();},restoreContext:()=>ext.restoreContext()}:ext;};});
  life.setDefaultTimeout(90000);
  await life.goto('http://127.0.0.1:4190/__world?quality=low',{waitUntil:'domcontentloaded',timeout:120000});const cycles=[];
  for(let i=0;i<3;i++){if(i)await life.evaluate(()=>window.mountWorld());await life.waitForFunction(()=>document.querySelector('.webgl-host')?.dataset.motion==='still');const before=await life.evaluate(()=>({...window.gpu}));await life.evaluate(()=>window.unmountWorld());await life.waitForFunction(()=>window.pendingWorldFrames()===0);const after=await life.evaluate(()=>({...window.gpu}));assert.equal(await life.locator('canvas').count(),0);assert.equal(after.lost,i+1);assert.ok(after.deletedBuffers>before.deletedBuffers);assert.ok(after.deletedTextures>before.deletedTextures);cycles.push({before,after});}
  await writeFile(`${directory}/lifecycle.json`,JSON.stringify(cycles,null,2));await life.close();await vite.close();vite=null;
 });
 await check('Tela compacta e ausência de erros ou dependências externas',async()=>{
  if(lifecycleOnly)await load(1,'noWebGL',false);
  await page.setViewportSize({width:390,height:844});for(let i=0;i<10;i++){await page.getByRole('button',{name:new RegExp(`^Ir ao slide ${i+1}:`)}).click();await page.waitForFunction(i=>location.hash===`#${i+1}`,i);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 });
}catch(error){console.error(error);await page.screenshot({path:`${directory}/failure.png`});process.exitCode=1;}finally{await persist();await vite?.close();await browser.close();process.exit(process.exitCode||0);}
