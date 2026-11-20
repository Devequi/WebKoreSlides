import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
process.env.PORT='4189';await import('../serve.mjs');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
const errors=[],external=[],checks=[],memory=[];let vite;
await page.addInitScript(()=>{window.introPhases=[];new MutationObserver(()=>{const el=document.querySelector('.presentation');if(el){const phase=Number(el.dataset.arenaPhase);if(!window.introPhases.includes(phase))window.introPhases.push(phase);}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-arena-phase']});});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await context.route('**/*',r=>{if(new URL(r.request().url()).origin!=='http://127.0.0.1:4189'){external.push(r.request().url());return r.abort();}return r.continue();});
const go=async(query='?quality=low',n=1)=>{await page.goto(`http://127.0.0.1:4189/${query}#${n}`);await page.reload();await page.waitForSelector('.hero');};
const ready=async()=>page.waitForFunction(()=>document.querySelector('.presentation').dataset.arenaPhase==='4',null,{timeout:45000});
const metrics=()=>page.locator('.webgl-host').evaluate(e=>({...e.dataset}));
const key=async(k)=>{await page.locator('h1').first().click();await page.keyboard.press(k);};
let enabled=!process.env.ARENA_START;
async function check(name,fn){if(!enabled){if(!name.startsWith(process.env.ARENA_START))return;enabled=true;}await fn();checks.push(name);console.log('PASS',name);}
await mkdir('test-results/arena',{recursive:true});
try{
if(process.env.ARENA_START){await go();await key('Enter');await ready();}
await check('Abertura em quatro fases, tipografia local, duas resoluções e enquadramento',async()=>{
 for(const [width,height]of [[1366,768],[1920,1080]]){
  await page.setViewportSize({width,height});if(width===1366)await go();await ready();await page.waitForTimeout(400);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.fonts.check('600 28px "Space Grotesk"')),true);
  assert.equal(await page.locator('.webgl-host canvas').count(),1);
  const viewport=await page.locator('.webgl-host canvas').boundingBox();assert.equal(Math.round(viewport.x),0);assert.equal(Math.round(viewport.y),0);assert.equal(Math.round(viewport.width),width);assert.equal(Math.round(viewport.height),height);
  assert.deepEqual(await page.evaluate(()=>window.introPhases),[0,1,2,3,4]);
  const clipped=await page.locator('.hero').evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('h1,h2,p,button,.cinematic-credits')].filter(x=>{const b=x.getBoundingClientRect();return b.width>0&&b.height>0&&(b.left<r.left-2||b.right>r.right+2||b.bottom>r.bottom+2);}).map(x=>x.textContent);});assert.deepEqual(clipped,[]);
  await page.screenshot({path:`test-results/arena/${width}-opening-final.png`});
 }
});
await check('Pular imediatamente por Enter e botão; navegar durante a introdução',async()=>{
 await key('e');await page.waitForTimeout(70);await key('Enter');await ready();assert.equal((await metrics()).phase,'4');
 await key('e');await page.getByRole('button',{name:'Pular abertura',exact:true}).click();await ready();
 await key('e');await page.keyboard.press('ArrowRight');await page.waitForTimeout(400);assert.equal(new URL(page.url()).hash,'#2');
 await page.keyboard.press('Home');await page.waitForTimeout(100);await page.keyboard.press('Space');await page.waitForTimeout(350);assert.equal(new URL(page.url()).hash,'#2');
});
await check('Retorno reinicia a abertura e a arena continua viva sem mouse',async()=>{
 await page.keyboard.press('Home');await ready();const a=Number((await metrics()).frames);await page.waitForFunction(n=>Number(document.querySelector('.webgl-host').dataset.frames)>n,a,{timeout:15000});
});
await check('Uma cena e recursos estáveis depois de vinte mudanças de capítulo',async()=>{
 const beforeWarm=Number((await metrics()).frames);await page.keyboard.press('End');await page.waitForFunction(n=>Number(document.querySelector('.webgl-host').dataset.frames)>n,beforeWarm);await page.keyboard.press('Home');await key('Enter');await ready();
 const baseline=await metrics();
 for(let i=0;i<10;i++){await page.keyboard.press('End');await page.waitForTimeout(160);await page.keyboard.press('Home');await key('Enter');await page.waitForTimeout(160);memory.push(await metrics());}
 assert.equal(await page.locator('canvas').count(),1);const current=await metrics();assert.ok(Number(current.geometries)<=Number(baseline.geometries)+1);assert.deepEqual(memory.slice(-5).map(x=>x.geometries),Array(5).fill(current.geometries));assert.equal(current.textures,baseline.textures);assert.ok(Number(current.geometries)<110);
 await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.waitForTimeout(350);const paused=Number((await metrics()).frames);await page.waitForTimeout(500);assert.equal(Number((await metrics()).frames),paused);
});
await check('Encerramento nas duas resoluções com enquadramento e iluminação próprios',async()=>{
 for(const [width,height]of [[1366,768],[1920,1080]]){await page.setViewportSize({width,height});await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelectorAll('section.slide').length===1);assert.equal(new URL(page.url()).hash,'#10');assert.match(await page.locator('.cinematic-credits').innerText(),/Felipe Devequi/);await page.screenshot({path:`test-results/arena/${width}-closing-final.png`});}
});
await check('Offline: cena, fonte, retorno e navegação sem recursos externos',async()=>{
 await context.setOffline(true);await page.keyboard.press('Home');await key('Enter');await ready();assert.equal(await page.locator('[data-renderer=webgl]').count(),1);await page.keyboard.press('End');await page.keyboard.press('Home');await key('Enter');await ready();await context.setOffline(false);assert.deepEqual(external,[]);
});
await check('Movimento reduzido renderiza o estado final e interrompe o loop',async()=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.presentation').classList.contains('reduced'));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await ready();const a=Number((await metrics()).frames);await page.waitForTimeout(700);assert.equal(Number((await metrics()).frames),a);await page.screenshot({path:'test-results/arena/reduced.png'});await page.emulateMedia({reducedMotion:'no-preference'});
});
await check('Fallback sem WebGL e após perda de contexto',async()=>{
 await page.locator('canvas').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));assert.equal(await page.locator('[data-renderer=static]').count(),1);
 await go('?noWebGL');await ready();assert.equal(await page.locator('.arena-fallback').count(),1);await page.screenshot({path:'test-results/arena/fallback.png'});
});
await check('Desmontagem libera buffers, texturas, contexto e canvas em três ciclos',async()=>{
 const source=`import React from 'react';import {createRoot} from 'react-dom/client';import {CourtScene} from '/src/components/CourtScene.jsx';let root;window.mountArena=(reduced=true)=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(CourtScene,{index:0,reduced}));};window.unmountArena=()=>root.unmount();window.mountArena();`;
 await writeFile('test-results/arena/lifecycle.jsx',source);
 vite=await createServer({server:{host:'127.0.0.1',port:4190,strictPort:true},plugins:[{name:'arena-lifecycle-test',configureServer(server){server.middlewares.use('/__arena-lifecycle',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__arena-lifecycle','<html><head><style>.webgl-host{width:800px;height:450px}</style></head><body><div id="root"></div><script type="module" src="/test-results/arena/lifecycle.jsx"></script></body></html>'));});}}]});await vite.listen();
 const lifecycle=await browser.newPage();lifecycle.on('pageerror',e=>errors.push(e.message));
 await lifecycle.addInitScript(()=>{const pending=new Set(),raf=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);window.requestAnimationFrame=fn=>{const id=raf(t=>{pending.delete(id);fn(t);});pending.add(id);return id;};window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};window.pendingArenaFrames=()=>pending.size;window.gpu={createdBuffers:0,deletedBuffers:0,createdTextures:0,deletedTextures:0,lost:0};for(const [method,field]of [['createBuffer','createdBuffers'],['deleteBuffer','deletedBuffers'],['createTexture','createdTextures'],['deleteTexture','deletedTextures']]){const orig=WebGL2RenderingContext.prototype[method];WebGL2RenderingContext.prototype[method]=function(...a){window.gpu[field]++;return orig.apply(this,a);};}const original=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(name){const ext=original.call(this,name);if(name==='WEBGL_lose_context'&&ext)return {loseContext:()=>{window.gpu.lost++;ext.loseContext();},restoreContext:()=>ext.restoreContext()};return ext;};});
 await lifecycle.goto('http://127.0.0.1:4190/__arena-lifecycle?quality=low');
 const cycles=[];
 for(let i=0;i<3;i++){if(i)await lifecycle.evaluate(()=>window.mountArena());await lifecycle.waitForFunction(()=>Number(document.querySelector('.webgl-host')?.dataset.frames)>0,null,{timeout:45000});const before=await lifecycle.evaluate(()=>({...window.gpu}));await lifecycle.evaluate(()=>window.unmountArena());await lifecycle.waitForTimeout(100);const after=await lifecycle.evaluate(()=>({...window.gpu}));assert.equal(await lifecycle.locator('canvas').count(),0);assert.equal(after.lost,i+1);assert.equal(await lifecycle.evaluate(()=>window.pendingArenaFrames()),0);assert.ok(after.deletedBuffers>before.deletedBuffers);assert.ok(after.deletedTextures>before.deletedTextures);cycles.push({before,after});}
 await writeFile('test-results/arena/lifecycle.json',JSON.stringify(cycles,null,2));await lifecycle.close();await vite.close();vite=null;
});
await check('Sem erros de execução e console na cena de produção',async()=>assert.deepEqual(errors,[]));
}catch(e){console.error(e);await page.screenshot({path:'test-results/arena/failure.png'});process.exitCode=1;}finally{await writeFile(process.env.ARENA_START?'test-results/arena/results-tail.json':'test-results/arena/results.json',JSON.stringify({checks,errors,external,memory},null,2));await vite?.close();await browser.close();process.exit(process.exitCode||0);}
