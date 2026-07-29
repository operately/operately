#!/usr/bin/env node

const path = require("path");
const { spawnSync } = require("child_process");
const { parseSplitArgs, splitFiles } = require("./test_splitting/file_splitter");
const { parseManifestPath, readTestManifest } = require("./test_splitting/manifest");
const { findUnitTestFiles } = require("./test_splitting/suite_files");

function selectUnitTests(argv = process.argv, files = findUnitTestFiles(), weightForFile) {
  const manifestPath = parseManifestPath(argv);

  if (manifestPath) {
    return readTestManifest(manifestPath, files);
  }

  return splitFiles(files, parseSplitArgs(argv), weightForFile);
}

function runTests(testFiles) {
  const files = testFiles.map((file) => path.relative("app", file));
  const result = spawnSync("mix", ["tests_with_retries", ...files], {
    cwd: "app",
    env: { ...process.env, MIX_ENV: "test" },
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

function main() {
  try {
    runTests(selectUnitTests());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  selectUnitTests,
};
