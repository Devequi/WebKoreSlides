import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
process.env.PORT='4199';
await import('../serve.mjs');
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:720},deviceScaleFactor:.65});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const settle=n=>page.waitForFunction(n=>{
  const host=document.querySelector('.webgl-host');
  return location.hash==='#'+n && host.dataset.chapter===String(n-1) &&
    host.dataset.progress==='1.000' && !document.querySelector('[data-gallery-flight]');
},n,{timeout:60000});
const press=key=>page.keyboard.press(key);
try{
  await page.goto('http://127.0.0.1:4199/?quality=low#2');
  await settle(2);
  // Deliver the second click as soon as React commits slide 03, before its camera arrives.
  const after=await page.evaluate(()=>new Promise(resolve=>{
    const app=document.querySelector('.presentation'),button=document.querySelector('.next-slide');
    const observer=new MutationObserver(()=>{
      if(app.dataset.universeChapter!=='2')return;
      observer.disconnect();button.click();
      setTimeout(()=>resolve(location.hash),50);
    });
    observer.observe(app,{attributes:true,attributeFilter:['data-universe-chapter']});
    button.click();
  }));
  assert.equal(after,'#3','Cliques repetidos durante 02 → 03');
  await settle(3);
  assert.equal(await page.locator('.museum-solution').isVisible(),true);
  assert.equal(await page.locator('.webgl-host').getAttribute('data-step'),'0');
  await press('ArrowRight');await settle(4);
  for(let i=1;i<5;i++){
    await press('ArrowRight');
    await page.locator('.journey-steps button').nth(i).locator('xpath=self::*[@aria-selected="true"]').waitFor({timeout:5000});
  }
  await press('ArrowRight');await settle(5);
  await press('ArrowLeft');await settle(4);
  for(let i=3;i>=0;i--){await press('ArrowLeft');await page.locator('.journey-steps button').nth(i).locator('xpath=self::*[@aria-selected="true"]').waitFor({timeout:5000});}
  for(const n of [3,2,1]){await press('ArrowLeft');await settle(n);}
  for(const n of [2,3]){await press('ArrowRight');await settle(n);}
  await page.reload();await settle(3);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:/^Ir ao slide 7:/}).click();await settle(7);
  await page.getByRole('button',{name:/^Ir ao slide 3:/}).click();await settle(3);
  await page.goto('http://127.0.0.1:4199/?noWebGL#2');
  await page.getByRole('button',{name:'Próximo slide',exact:true}).dblclick();
  assert.equal(new URL(page.url()).hash,'#3');
  await page.locator('.museum-solution h3').first().click();
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ArrowRight');
  await page.keyboard.up('ArrowRight');
  await page.locator('.journey-layout').waitFor();
  assert.equal(await page.getByRole('tab').first().getAttribute('aria-selected'),'true');
  assert.deepEqual(errors,[]);
  console.log('PASS 01–05, retorno, cliques rápidos, cinco etapas, salto direto, reload e resize');
}catch(e){console.error(e,await page.locator('.webgl-host').evaluate(el=>({...el.dataset})),page.url());process.exitCode=1;}finally{await browser.close();process.exit(process.exitCode||0);}
