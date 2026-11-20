import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
process.env.PORT='4203';
await import('../serve.mjs');
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:.6});
const warnings=[];
page.on('console',m=>{if(m.type()==='error'||m.text().includes('alternativa estática'))warnings.push(m.text());});
page.on('pageerror',e=>warnings.push(e.message));
const world=page.locator('.webgl-host');
async function arrived(n){
  await page.waitForFunction(n=>{
    const d=document.querySelector('.webgl-host').dataset;
    return document.querySelector('.performance-universe.static')||
      (d.chapter===String(n-1)&&d.progress==='1.000'&&!document.querySelector('[data-gallery-flight]'));
  },n,{timeout:60000});
  assert.equal(await page.locator('.performance-universe.static').count(),0,warnings.join('\n'));
  assert.equal(new URL(page.url()).hash,'#'+n);
}
try{
  // RAF timestamps mark the frame boundary, which can predate a chapter change in that frame.
  await page.addInitScript(()=>{
    const raf=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=cb=>raf(t=>cb(document.querySelector('[data-gallery-flight]')?t-65:t));
  });
  await page.goto('http://127.0.0.1:4203/?quality=low#4');await arrived(4);
  const end=await world.getAttribute('data-camera');
  await page.keyboard.press('ArrowLeft');await arrived(3);
  const start=await world.getAttribute('data-camera');
  await page.waitForFunction(()=>document.querySelector('.webgl-host').dataset.athletes==='7');
  await world.locator('canvas').evaluate(c=>c.dataset.cycleTest='original');
  let baseline;
  const cycleTimes=[];
  for(let i=1;i<=10;i++){
    const before=performance.now();
    await page.keyboard.press('ArrowRight');
    if(i===2)await page.setViewportSize({width:880,height:670});
    await arrived(4);
    assert.equal(await world.getAttribute('data-camera'),end);
    await page.keyboard.press('ArrowLeft');await arrived(3);
    assert.equal(await world.getAttribute('data-camera'),start);
    const resources=await world.evaluate(el=>[el.dataset.geometries,el.dataset.textures,el.dataset.athletes]);
    if(i===1)baseline=resources;else assert.deepEqual(resources,baseline);
    assert.equal(await world.locator('canvas').getAttribute('data-cycle-test'),'original');
    cycleTimes.push((performance.now()-before)/1000);
    console.log('OK ciclo',i);
  }
  console.log('Geometrias, texturas e atletas:',baseline,'Segundos por ciclo:',cycleTimes.map(t=>t.toFixed(1)));
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('[data-gallery-flight="3"]'));
  // Activate the indicator without moving the mouse, keeping the parallax input identical.
  await page.getByRole('button',{name:/^Ir ao slide 3:/}).evaluate(button=>button.click());
  await arrived(3);
  assert.equal(await world.getAttribute('data-camera'),start);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('[data-gallery-flight="3"]'));
  await world.locator('canvas').evaluate(c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await page.locator('.performance-universe.static').waitFor();
  assert.equal(await page.locator('[data-gallery-flight]').count(),0);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelectorAll('[role=tab]')[1]?.getAttribute('aria-selected')==='true');
  assert.deepEqual(warnings,[]);
}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();process.exit(process.exitCode||0);}
