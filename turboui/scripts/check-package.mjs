import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkArtifact } from "./check-artifact.mjs";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

await main();

async function main() {
  const retainedDirectory = process.env.TURBOUI_PACKAGE_CHECK_DIR;
  const workspace = await createWorkspace(retainedDirectory);

  try {
    console.log(`Checking package outside the repository: ${workspace}`);
    const archivePath = await buildPackage(workspace);
    await checkPackedArtifact(archivePath, workspace);
    await checkInstalledConsumer(archivePath, workspace);

    console.log("Package passed isolated build, pack, artifact, and installed-consumer checks.");
  } finally {
    if (!retainedDirectory) await rm(workspace, { recursive: true, force: true });
  }
}

async function createWorkspace(retainedDirectory) {
  const workspace = retainedDirectory
    ? path.resolve(retainedDirectory)
    : await mkdtemp(path.join(tmpdir(), "turboui-package-"));

  await mkdir(workspace, { recursive: true });
  assert.equal((await readdir(workspace)).length, 0, "Package check directory must be empty");
  return workspace;
}

async function buildPackage(workspace) {
  const sourceDirectory = path.join(workspace, "source");
  const buildInputs = [
    "src",
    "styles",
    "scripts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.build.json",
    "tailwind.config.js",
    "LICENSE",
    "README.md",
  ];

  // Build without access to sibling app dependencies or existing build output.
  await mkdir(sourceDirectory);
  for (const name of buildInputs) {
    await cp(path.join(packageRoot, name), path.join(sourceDirectory, name), { recursive: true });
  }

  runNpm(["ci"], sourceDirectory);
  runNpm(["pack", "--silent", "--pack-destination", workspace], sourceDirectory);

  const archiveName = (await readdir(workspace)).find((name) => name.endsWith(".tgz"));
  assert.ok(archiveName, "npm pack did not produce a tarball");
  return path.join(workspace, archiveName);
}

async function checkPackedArtifact(archivePath, workspace) {
  execFileSync("tar", ["-xzf", archivePath, "-C", workspace], { stdio: "inherit" });
  const packageDirectory = path.join(workspace, "package");
  await checkArtifact(packageDirectory);

  const packedFiles = await readdir(packageDirectory);
  for (const directory of ["src", "scripts", "tests", ".storybook"]) {
    assert.ok(!packedFiles.includes(directory), `Development directory included in package: ${directory}`);
  }
}

function runNpm(args, directory) {
  execFileSync("npm", ["--no-audit", "--no-fund", ...args], {
    cwd: directory,
    stdio: "inherit",
  });
}

async function checkInstalledConsumer(archivePath, workspace) {
  const consumerDirectory = path.join(workspace, "consumer");
  await cp(path.join(packageRoot, "scripts/package-consumer"), consumerDirectory, { recursive: true });

  // Install the actual archive with its declared dependencies, without source aliases
  // or access to the package builder's development dependencies.
  runNpm(["install", "--ignore-scripts", archivePath], consumerDirectory);
  runNpm(["run", "build"], consumerDirectory);
  if (!process.env.CHROMIUM_EXECUTABLE_PATH) {
    runNpm(["exec", "--", "playwright", "install", "chromium"], consumerDirectory);
  }
  runNpm(["test"], consumerDirectory);
}
