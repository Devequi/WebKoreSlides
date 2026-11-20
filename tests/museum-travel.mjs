import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PORT='4194';await import('../serve.mjs');
await mkdir('test-results/museum',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[];
page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
const data=()=>page.locator('.webgl-host').evaluate(e=>({...e.dataset}));
async function ready(index){await page.waitForFunction(i=>{const d=document.querySelector('.webgl-host')?.dataset;return d?.chapter===String(i)&&d.progress==='1.000'&&d.athletes==='7';},index,{timeout:60000});}
try{
 await page.goto('http://127.0.0.1:4194/?quality=low#2');await ready(1);const before=await data();
 await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:/^Ir ao slide 3:/}).click();
 const handle=await page.waitForFunction(()=>{const d=document.querySelector('.webgl-host')?.dataset,p=Number(d?.progress);return d?.chapter==='2'&&p>.35&&p<.7?{...d}:false;});
 const middle=await handle.jsonValue();assert.ok(Number(middle.camera.split(',')[2])<11);assert.notEqual(middle.pose,before.pose);
 await ready(2);const after=await data();assert.equal(Number(after.camera.split(',')[2]),16.5);assert.notEqual(after.pose,before.pose);
 await page.getByRole('button',{name:/^Ir ao slide 2:/}).click();await ready(1);assert.equal((await data()).pose,before.pose);
 for(const i of [2,1,2])await page.getByRole('button',{name:new RegExp(`^Ir ao slide ${i+1}:`)}).click();await ready(2);assert.equal((await data()).pose,after.pose);
 assert.deepEqual(errors,[]);await writeFile('test-results/museum/travel.json',JSON.stringify({check:'Câmera percorre a região frontal dos fragmentos e retorna deterministicamente',before,middle,after,errors},null,2));console.log('PASS travelling em profundidade, retorno e interrupção');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser.close();process.exit(process.exitCode||0);}
