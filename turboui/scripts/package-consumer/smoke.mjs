import assert from "node:assert/strict";
import { chromium } from "playwright";
import { preview } from "vite";

const server = await preview({ preview: { host: "127.0.0.1", port: 0, open: false } });
let browser;

try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  const address = server.httpServer.address();
  assert.ok(address && typeof address !== "string");
  await page.goto(`http://127.0.0.1:${address.port}`);
  await page.getByRole("button", { name: "Clicks: 0", exact: true }).click();
  await page.getByRole("button", { name: "Clicks: 1", exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Project" }).getAttribute("href"), "/project");
  assert.equal(
    await page.getByRole("button").evaluate((button) => getComputedStyle(button).display),
    "inline-block",
    "The installed stylesheet must style the rendered button",
  );
  assert.deepEqual(errors, [], "Installed package must load without browser errors");
  console.log("Installed consumer type-checks, bundles, renders, and handles clicks.");
} finally {
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => (error ? reject(error) : resolve())));
}
