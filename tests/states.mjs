import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage();
const checks = [];
await mkdir("test-results/states", { recursive: true });
async function bounds(name) {
  await page.waitForTimeout(100);
  const issue = await page.evaluate(() => {
    const s = document.querySelector(".slide"),
      r = s.getBoundingClientRect();
    return {
      scroll:
        s.scrollHeight > s.clientHeight + 2 ||
        s.scrollWidth > s.clientWidth + 2,
      children: [
        ...s.querySelectorAll("h1,h2,h3,p,button,.product,.entity-detail"),
      ]
        .filter((e) => {
          const b = e.getBoundingClientRect();
          return (
            b.width &&
            b.height &&
            (b.bottom > r.bottom + 2 ||
              b.right > r.right + 2 ||
              b.left < r.left - 2)
          );
        })
        .map((e) => e.textContent.slice(0, 100)),
    };
  });
  if (issue.scroll || issue.children.length) {
    await page.screenshot({ path: "test-results/states/failure.png" });
    console.log(
      await page.evaluate(() =>
        Object.fromEntries(
          [
            ".slide",
            ".journey-layout",
            ".journey-main",
            ".product",
            ".product-bar",
            ".product-content",
            ".product-heading",
            ".profile-tabs",
            ".criterion",
            ".score",
            ".product-foot",
          ].map((s) => {
            const r = document.querySelector(s)?.getBoundingClientRect();
            return [
              s,
              r ? { top: r.top, bottom: r.bottom, height: r.height } : null,
            ];
          }),
        ),
      ),
    );
  }
  assert.deepEqual(issue, { scroll: false, children: [] }, name);
  checks.push(name);
}
try {
  await page.goto("http://127.0.0.1:5174");
  await page.getByRole("heading", { name: "WEBKORE", exact: true }).waitFor();
  checks.push("Modo dev: renderização React confirmada");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [
    [1366, 768],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("http://127.0.0.1:4174/#4");
    for (let i = 0; i < 5; i++) {
      await page.getByRole("tab").nth(i).click();
      await bounds(`${width}: jornada ${i + 1}`);
      if (i === 4)
        await page.screenshot({
          path: `test-results/states/${width}-jornada.png`,
        });
    }
    await page.goto("http://127.0.0.1:4174/#5");
    for (let i = 0; i < 5; i++) {
      await page.getByRole("tab").nth(i).click();
      await bounds(`${width}: funcionalidade ${i + 1}`);
      if (i === 2 || i === 3)
        await page.screenshot({
          path: `test-results/states/${width}-funcionalidade-${i + 1}.png`,
        });
    }
    await page.goto("http://127.0.0.1:4174/#6");
    for (let i = 0; i < 3; i++) {
      await page.locator(".architecture-node").nth(i).click();
      await bounds(`${width}: arquitetura ${i + 1}`);
    }
    await page.goto("http://127.0.0.1:4174/#7");
    for (let i = 0; i < 6; i++) {
      await page.locator(".entity-grid button").nth(i).click();
      await bounds(`${width}: entidade ${i + 1}`);
    }
    await page.getByRole("button", { name: "Atleta autenticado" }).click();
    await bounds(`${width}: acesso negado`);
    await page.screenshot({
      path: `test-results/states/${width}-seguranca.png`,
    });
    await page.goto("http://127.0.0.1:4174/#8");
    for (let i = 0; i < 4; i++) {
      await page.getByRole("tab").nth(i).click();
      await bounds(`${width}: metodologia ${i + 1}`);
    }
    await page.getByRole("button", { name: "Menu dos 10 slides" }).click();
    const r = await page.getByRole("dialog").boundingBox();
    assert.ok(r.y >= 0 && r.y + r.height <= height);
    await page.screenshot({ path: `test-results/states/${width}-menu.png` });
    checks.push(`${width}: menu visível`);
  }
  console.log(
    `PASS: ${checks.length} verificações de estados internos e modo dev.`,
  );
} finally {
  await writeFile(
    "test-results/states/results.json",
    JSON.stringify({ checks }, null, 2),
  );
  await browser.close();
}
