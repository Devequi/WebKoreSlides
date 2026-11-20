import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

process.env.PORT = '4197';
await import('../serve.mjs');
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
async function at(slide) {
  await page.waitForURL(url => url.hash === '#' + slide);
  await page.locator('.slide-' + (slide - 1)).waitFor();
}
try {
  await page.goto('http://127.0.0.1:4197/?step=1&quality=low#3');
  const solution = page.locator('.webgl-host[data-chapter="2"][data-step="0"][data-progress="1.000"]');
  await solution.waitFor({ timeout: 60000 });
  const camera = await solution.getAttribute('data-camera');
  assert.ok(camera);
  assert.equal(await page.locator('.solution-links').count(), 0);
  await page.waitForFunction(() => document.querySelector('.webgl-host').dataset.athletes === '7');
  assert.deepEqual(await page.locator('.solution-benefits h3').allTextContents(), ['Registro centralizado', 'Evolução mensurável']);
  assert.deepEqual(await page.locator('.solution-profiles dt').allTextContents(), ['Treinador', 'Atleta']);
  await mkdir('test-results/museum', { recursive:true });
  for (const [width,height] of [[1366,768],[1920,1080]]) {
    await page.setViewportSize({width,height});
    const blocks=await page.locator('.slide-2 .slide-heading,.solution-context,.solution-benefits,.solution-profiles,footer').evaluateAll(
      elements=>elements.map(el=>el.getBoundingClientRect().toJSON())
    );
    assert.equal(blocks.length,5);
    for(let i=1;i<blocks.length;i++)assert.ok(blocks[i].top>=blocks[i-1].bottom-1);
    assert.ok(blocks[3].right<width*.50);
    await page.screenshot({path:`test-results/museum/solution-${width}.png`});
  }
  await page.keyboard.press('ArrowRight');
  await at(4);
  await page.getByRole('button', { name: 'Slide anterior', exact: true }).click();
  await at(3);
  await solution.waitFor();
  assert.equal(await solution.getAttribute('data-camera'), camera);
  await page.getByRole('button', { name: 'Próximo slide', exact: true }).click();
  await at(4);
  await page.getByRole('button', { name: /^Ir ao slide 3:/ }).click();
  await at(3);
  await page.getByRole('button', { name: 'Notas nesta janela' }).click();
  const notes = page.locator('.inline-notes');
  assert.doesNotMatch(await notes.innerText(), /Etapa 1 de|1\/2/);
  await notes.getByRole('button', { name: 'Próximo slide' }).click();
  await at(4);
  assert.deepEqual(errors, []);
  console.log('OK: link antigo, câmera da solução, teclado, botões, salto e notas.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  process.exit(process.exitCode ?? 0);
}
