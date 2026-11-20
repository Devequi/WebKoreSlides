import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

process.env.PORT='4198';
await import('../serve.mjs');
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:.8,reducedMotion:'no-preference'});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const read=()=>page.locator('.webgl-host').evaluate(e=>({...e.dataset}));
function settled(chapter){
  return page.waitForFunction(i=>{const e=document.querySelector('.webgl-host');return e.dataset.chapter===String(i)&&e.dataset.progress==='1.000'&&!document.querySelector('[data-gallery-flight]');},chapter,{timeout:60000});
}
try{
  await page.goto('http://127.0.0.1:4198/?quality=low#3');
  await settled(2);
  const initial=await read();
  const route=await page.evaluate(()=>new Promise(resolve=>{
    const host=document.querySelector('.webgl-host'),samples=[];
    const observer=new MutationObserver(()=>{
      if(host.dataset.chapter!=='3')return;
      if(!samples.length&&document.querySelector('[data-gallery-flight]'))
        document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
      samples.push({p:Number(host.dataset.progress),camera:host.dataset.camera});
      if(host.dataset.progress==='1.000'){observer.disconnect();resolve(samples);}
    });
    observer.observe(host,{attributes:true,attributeFilter:['data-frames']});
    document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  }));
  assert.ok(route.some(s=>s.p>0&&s.p<1&&s.camera!==initial.camera),JSON.stringify(route));
  await settled(3);
  assert.equal((await read()).step,'0');
  await mkdir('test-results/journey',{recursive:true});
  await page.screenshot({path:'test-results/journey/arrival.png'});
  await page.mouse.move(1230,80);
  await page.waitForFunction(()=>document.querySelector('.webgl-host').dataset.camera!=='37,4.4,-3');
  await page.mouse.move(683,384);
  await page.getByRole('tab').last().click();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.presentation').dataset.galleryFlight==='4');
  await page.keyboard.press('ArrowRight');
  await settled(4);
  assert.equal((await read()).step,'0');
  assert.equal((await read()).camera.split(',')[2],'-46');
  await page.waitForTimeout(600);
  await page.screenshot({path:'test-results/journey/features.png'});
  const hide=await page.addStyleTag({content:'main,header,footer{visibility:hidden!important}'});
  await page.screenshot({path:'test-results/journey/features-world.png'});
  await hide.evaluate(el=>el.remove());
  await page.keyboard.press('ArrowLeft');
  await settled(3);
  assert.equal((await read()).camera.split(',')[2],'-3');
  assert.equal((await read()).step,'4');
  await page.getByRole('tab').first().click();
  await page.keyboard.press('ArrowLeft');
  await settled(2);
  const restored=await read();
  assert.equal(restored.pose,initial.pose);
  assert.equal(restored.camera.split(',')[2],initial.camera.split(',')[2]);
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:4198/?quality=low#4');
  await settled(3);
  assert.equal(await page.getByRole('tab').count(),5);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:/^Ir ao slide 5:/}).click();
  await settled(4);await page.reload();await settled(4);
  assert.equal(await page.getByRole('tab').count(),5);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(let i=1;i<5;i++){
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(step=>document.querySelector('.webgl-host').dataset.step===String(step),i);
  }
  await page.keyboard.press('ArrowRight');await settled(5);
  await page.keyboard.press('ArrowLeft');await settled(4);
  assert.equal((await read()).step,'4');
  assert.deepEqual(errors,[]);
  console.log('OK: travessia, bloqueio, etapas, retorno, parallax, entrada direta e movimento reduzido em celular.');
}catch(error){console.error(error,errors,await read(),page.url());process.exitCode=1;}
finally{await browser.close();process.exit(process.exitCode||0);}
