import assert from "node:assert/strict";
import { chromium } from "playwright";
import { preview } from "vite";

const server = await preview({ preview: { host: "127.0.0.1", port: 0, open: false } });
let browser;

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const address = server.httpServer.address();
  assert.ok(address && typeof address !== "string");
  await page.goto(`http://127.0.0.1:${address.port}`);
  const button = page.locator('[data-test-id="increment"]');
  await page.locator('[data-test-id="consumer"][data-click-count="0"]').waitFor();
  await button.click();
  await page.locator('[data-test-id="consumer"][data-click-count="1"]').waitFor();
  assert.equal(await page.locator('[data-test-id="project-link"]').getAttribute("href"), "/project");
  assert.equal(
    await button.evaluate((element) => getComputedStyle(element).display),
    "inline-block",
    "The installed stylesheet must style the rendered button",
  );
  assert.deepEqual(errors, [], "Installed package must load without browser errors");
  console.log("Installed consumer type-checks, bundles, renders, and handles clicks.");
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => (error ? reject(error) : resolve())));
}
