import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.PRESENTATION_URL || "http://127.0.0.1:4174";
await mkdir("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1366, height: 768 },
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [],
  failedRequests = [],
  remote = [],
  checks = [],
  overflow = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("requestfailed", (request) =>
  failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText,
  }),
);
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
await context.route("**/*", (route) => {
  const u = new URL(route.request().url());
  if (u.origin !== new URL(base).origin) {
    remote.push(u.origin);
    return route.abort();
  }
  return route.continue();
});
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log("PASS", name);
}
async function goto(n) {
  await page.goto(`${base}/#${n}`);
  await page.locator(`section[aria-label^="Slide ${n}:"]`).waitFor();
  await page.waitForTimeout(350);
}
async function current(n) {
  await page.waitForFunction((n) => location.hash === `#${n}`, n);
  await page.waitForFunction(
    () => document.querySelectorAll("section.slide").length === 1,
  );
  assert.equal(await page.locator("section.slide").count(), 1);
}
try {
  await check("Abertura, iniciar e botões anterior/próximo", async () => {
    await goto(1);
    await page.getByRole("button", { name: /Iniciar apresentação/ }).click();
    await current(2);
    await page
      .getByRole("button", { name: "Slide anterior", exact: true })
      .click();
    await current(1);
    await page
      .getByRole("button", { name: "Próximo slide", exact: true })
      .click();
    await current(2);
  });
  await check("Atalhos: direita, esquerda, Space, Home, End, R", async () => {
    await page.locator("h2[tabindex]").focus();
    await page.keyboard.press("ArrowRight");
    await current(3);
    await page.keyboard.press("ArrowLeft");
    await current(2);
    await page.keyboard.press("Space");
    await current(3);
    await page.keyboard.press("End");
    await current(10);
    await page.keyboard.press("Home");
    await current(1);
    await page.keyboard.press("End");
    await current(10);
    await page.keyboard.press("r");
    await current(1);
  });
  await check(
    "Menu: dez capítulos, foco contido, Escape e seleção direta",
    async () => {
      await page.getByRole("button", { name: "Menu dos 10 slides" }).click();
      const dialog = page.getByRole("dialog");
      assert.equal(await dialog.locator(".chapter-grid button").count(), 10);
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await page.evaluate(
          () => document.activeElement.closest('[role="dialog"]') !== null,
        ),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(await dialog.count(), 0);
      await page.getByRole("button", { name: "Menu dos 10 slides" }).click();
      await dialog.getByRole("button", { name: /04 Jornada/ }).click();
      await current(4);
    },
  );
  await check(
    "Jornada: cinco passos, retorno, reset e avanço global",
    async () => {
      await page.locator("h2[tabindex]").focus();
      for (let i = 1; i < 5; i++) {
        await page.keyboard.press("Space");
        assert.equal(
          await page.getByRole("tab", { selected: true }).innerText(),
          `${String(i + 1).padStart(2, "0")}\n${["Entrada", "Aprovação", "Treinamento", "Avaliação", "Acompanhamento"][i]}`,
        );
      }
      await page.keyboard.press("ArrowLeft");
      assert.match(
        await page.getByRole("tab", { selected: true }).innerText(),
        /Avaliação/,
      );
      await page.keyboard.press("e");
      assert.match(
        await page.getByRole("tab", { selected: true }).innerText(),
        /Entrada/,
      );
      await page.getByRole("tab", { name: /03 Treinamento/ }).click();
      await page.getByRole("button", { name: "Reiniciar jornada" }).click();
      await page.locator("h2[tabindex]").focus();
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Próximo slide", exact: true })
        .click();
      await current(5);
    },
  );
  await check(
    "Explorador de funcionalidades, gráfico, slider e CSV",
    async () => {
      for (const name of [
        "Equipes",
        "Treinos",
        "Avaliações",
        "Evolução",
        "Relatórios",
      ]) {
        await page.getByRole("tab", { name: new RegExp(name) }).click();
        assert.equal(
          await page
            .getByRole("tab", { name: new RegExp(name) })
            .getAttribute("aria-selected"),
          "true",
        );
      }
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Baixar exemplo CSV" }).click();
      assert.equal(
        (await download).suggestedFilename(),
        "webkore-demonstracao.csv",
      );
      await page.getByRole("tab", { name: /Avaliações/ }).click();
      const slider = page.getByRole("slider");
      await slider.focus();
      await page.keyboard.press("ArrowLeft");
      assert.equal(await slider.inputValue(), "7");
      assert.equal(new URL(page.url()).hash, "#5");
      assert.match(await page.locator(".score").innerText(), /7,8/);
      await page.getByRole("tab", { name: /Evolução/ }).click();
      assert.equal(await page.locator(".recharts-surface").count(), 1);
    },
  );
  await check("Arquitetura: três camadas e requisição repetível", async () => {
    await goto(6);
    for (const name of ["Interface", "API", "Persistência"])
      await page
        .locator(".architecture-node")
        .filter({ hasText: name })
        .click();
    await page.getByRole("button", { name: "Simular requisição" }).click();
    await page.getByRole("status").filter({ hasText: /200/ }).waitFor();
    await page.getByRole("button", { name: "Repetir requisição" }).click();
    await page.getByRole("status").filter({ hasText: /200/ }).waitFor();
  });
  await check(
    "Banco: seis entidades e segurança: permissão/403/reset",
    async () => {
      await goto(7);
      for (const name of [
        "User",
        "Team",
        "Membership",
        "Training",
        "TrainingRecord",
        "Evaluation",
      ]) {
        await page
          .locator(".entity-grid button")
          .filter({
            hasText: new RegExp(
              `^${name}id|^${name}teamId|^${name}trainingId|^${name}recordId`,
            ),
          })
          .click();
        assert.equal(await page.locator(".entity-detail h3").innerText(), name);
      }
      await page.getByRole("button", { name: "Atleta autenticado" }).click();
      assert.match(
        await page.locator(".access-demo [role=status]").innerText(),
        /403/,
      );
      await page
        .getByRole("button", { name: "Treinador proprietário" })
        .click();
      assert.match(
        await page.locator(".access-demo [role=status]").innerText(),
        /PERMITIDO/,
      );
      await page
        .getByRole("button", { name: "Reiniciar experiência", exact: true })
        .click();
      assert.match(
        await page.locator(".access-demo [role=status]").innerText(),
        /Selecione/,
      );
    },
  );
  await check("Timeline: quatro etapas selecionáveis", async () => {
    await goto(8);
    for (const name of [
      "Requisitos",
      "Modelagem",
      "Implementação",
      "Verificação",
    ]) {
      await page.getByRole("tab", { name: new RegExp(name) }).click();
      assert.equal(
        await page
          .getByRole("tab", { name: new RegExp(name) })
          .getAttribute("aria-selected"),
        "true",
      );
    }
  });
  await check("Fullscreen: entrada e saída pelo botão", async () => {
    await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
    assert.equal(
      await page.evaluate(() => Boolean(document.fullscreenElement)),
      true,
    );
    await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
    assert.equal(
      await page.evaluate(() => Boolean(document.fullscreenElement)),
      false,
    );
    await page.getByRole("button", { name: "Tela cheia", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.fullscreenElement);
  });
  await check(
    "Efeitos reduzidos: preferência do sistema e controle",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() =>
        document.querySelector(".presentation").classList.contains("reduced"),
      );
      assert.match(
        await page.locator(".presentation").getAttribute("class"),
        /reduced/,
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("button", { name: "Reduzir efeitos" }).click();
      assert.equal(
        await page
          .getByRole("button", { name: "Reduzir efeitos" })
          .getAttribute("aria-pressed"),
        "true",
      );
    },
  );
  await check(
    "20 capturas e ausência de overflow nas resoluções de projeção",
    async () => {
      for (const [width, height] of [
        [1366, 768],
        [1920, 1080],
      ]) {
        await page.setViewportSize({ width, height });
        for (let n = 1; n <= 10; n++) {
          await goto(n);
          const issue = await page.evaluate(() => {
            const s = document.querySelector(".slide"),
              r = s.getBoundingClientRect();
            return {
              scroll:
                s.scrollHeight > s.clientHeight + 2 ||
                s.scrollWidth > s.clientWidth + 2,
              children: [
                ...s.querySelectorAll(
                  "h1,h2,h3,p,button,.product,.entity-detail,.credits",
                ),
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
          if (issue.scroll || issue.children.length)
            overflow.push({ width, height, n, ...issue });
          await page.screenshot({
            path: `test-results/${width}-slide-${String(n).padStart(2, "0")}.png`,
          });
        }
      }
      assert.deepEqual(overflow, []);
    },
  );
  await check("Navegação rápida e repetida", async () => {
    await goto(2);
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press(i % 3 === 0 ? "ArrowLeft" : "ArrowRight");
    }
    await page.keyboard.press("Home");
    await current(1);
    await page.keyboard.press("End");
    await current(10);
  });
  await check(
    "Execução sem rede após carregar: dez slides e demonstrações",
    async () => {
      await goto(1);
      await context.setOffline(true);
      for (let n = 1; n <= 10; n++) {
        await page
          .getByRole("button", { name: new RegExp(`^Ir ao slide ${n}:`) })
          .click();
        await current(n);
      }
      await page.getByRole("button", { name: /^Ir ao slide 4:/ }).click();
      await current(4);
      await page.locator("h2[tabindex]").focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press("Space");
      await page
        .getByRole("button", { name: "Próximo slide", exact: true })
        .click();
      await current(5);
      await page.getByRole("tab", { name: /Evolução/ }).click();
      assert.equal(await page.locator(".recharts-surface").count(), 1);
      await context.setOffline(false);
    },
  );
  await check(
    "Zero recursos externos e zero erros de console/runtime",
    async () => {
      assert.deepEqual(remote, []);
      assert.deepEqual(errors, []);
    },
  );
  await check(
    "Tela compacta: conteúdo alcançável e sem overflow horizontal",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      for (let n = 1; n <= 10; n++) {
        await goto(n);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
      }
    },
  );
} catch (error) {
  await page.screenshot({ path: "test-results/failure.png" });
  throw error;
} finally {
  await writeFile(
    "test-results/results.json",
    JSON.stringify(
      { checks, errors, failedRequests, remote, overflow },
      null,
      2,
    ),
  );
  await browser.close();
}
