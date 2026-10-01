import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";

const publicExportPaths = [".", "./styles.css"];

export async function checkArtifact(packageDirectory) {
  await checkManifest(packageDirectory);
  await checkRequiredDocuments(packageDirectory);
  await checkCompiledFiles(packageDirectory);
  await checkStylesheet(packageDirectory);

  console.log("Package artifact is complete.");
}

async function checkManifest(packageDirectory) {
  const manifestPath = path.join(packageDirectory, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  assert.equal(manifest.name, "@operately/turboui");
  assert.equal(manifest.publishConfig.access, "public");
  assert.match(manifest.version, /^\d+\.\d+\.\d+/);

  assert.deepEqual(Object.keys(manifest.exports).sort(), publicExportPaths, "Expose only the root API and CSS asset");
  for (const exportPath of publicExportPaths) {
    const entry = manifest.exports[exportPath];
    assert.ok(entry, `Missing export: ${exportPath}`);

    const targets = typeof entry === "string" ? [entry] : Object.values(entry);
    for (const target of targets) {
      await access(path.join(packageDirectory, target));
    }
  }
}

async function checkRequiredDocuments(packageDirectory) {
  for (const name of ["LICENSE", "README.md"]) {
    await access(path.join(packageDirectory, name));
  }
}

async function checkCompiledFiles(packageDirectory) {
  const distDirectory = path.join(packageDirectory, "dist");
  const files = await readdir(distDirectory, { recursive: true });
  // Demo fixtures under dist/demos are intentional public data, unlike story/test fixtures.
  const developmentFilePattern =
    /(?:\.stories\.|\.test\.|\.spec\.|mockData|Story\.|storybook|__mocks__|(?:^|\/)tests\/)/;

  for (const declaration of ["demos/index.d.ts", "demos/kpis/fixtures.d.ts", "demos/kpis/useKpiDemo.d.ts"]) {
    await access(path.join(distDirectory, declaration));
  }

  for (const file of files) {
    assert.doesNotMatch(file, developmentFilePattern, `Development artifact included in package: ${file}`);
    if (!/\.(?:mjs|ts)$/.test(file)) continue;

    const content = await readFile(path.join(distDirectory, file), "utf8");
    checkModuleImports(content, file);
  }
}

function checkModuleImports(content, filename) {
  assert.doesNotMatch(content, /(?:\.\.\/)+app\//, `App dependency in ${filename}`);
  assert.doesNotMatch(content, /from ["']@\//, `App alias in ${filename}`);

  assert.doesNotMatch(
    content,
    /(?:from\s*|import\s*\(?)["'](?:@storybook\/|@testing-library\/|(?:[^"']*\/)?utils\/storybook)/,
    `Development import in ${filename}`,
  );

  if (filename.endsWith(".d.ts")) {
    assert.doesNotMatch(content, /@tabler\/icons-react\/dist\//, `Untyped icon import in ${filename}`);
  }
}

async function checkStylesheet(packageDirectory) {
  const css = await readFile(path.join(packageDirectory, "dist/styles.css"), "utf8");
  const requiredSelectors = [".light", ".dark", ".ProseMirror", ".react-datepicker", ".bg-surface-base"];

  for (const selector of requiredSelectors) {
    assert.ok(css.includes(selector), `Missing stylesheet selector: ${selector}`);
  }
  assert.doesNotMatch(css, /@(?:import|tailwind|apply)\b/, "Stylesheet must be fully compiled and self-contained");
}

if (process.argv[2]) await checkArtifact(path.resolve(process.argv[2]));
