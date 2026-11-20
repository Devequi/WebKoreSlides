import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PORT='4189';await import('../serve.mjs');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:1366,height:768}});let errors=[];page.on('pageerror',e=>errors.push(e.message));await mkdir('test-results/refinement',{recursive:true});
for(let n=1;n<=10;n++){await page.goto('http://127.0.0.1:4189/?noWebGL#'+n);await page.waitForTimeout(400);await page.screenshot({path:`test-results/refinement/slide-${n}.png`});}
console.log(errors);await browser.close();process.exit();
