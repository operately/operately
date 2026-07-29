#!/usr/bin/env node

// Usage:
//
// node scripts/run_feature_tests.js $SPLIT_INDEX $SPLIT_TOTAL
//
// SPLIT_INDEX and SPLIT_TOTAL are used to split the tests into multiple
// processes. For example, if you have 10 tests and you want to run them in
// 3 processes, you would set SPLIT_TOTAL to 3 and SPLIT_INDEX to 1, 2, or 3.
//
// SPLIT_INDEX is 1-based to be compatible with SemaphoreCI's env variables.

const path = require("path");
const { spawnSync } = require("child_process");
const { parseSplitArgs, splitFiles } = require("./test_splitting/file_splitter");
const { parseManifestPath, readTestManifest } = require("./test_splitting/manifest");
const { findFeatureTestFiles } = require("./test_splitting/suite_files");

function selectFeatureTests(argv = process.argv, files = findFeatureTestFiles(), weightForFile) {
  const manifestPath = parseManifestPath(argv);

  if (manifestPath) {
    return readTestManifest(manifestPath, files);
  }

  return splitFiles(files, parseSplitArgs(argv, { required: true }), weightForFile);
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
    runTests(selectFeatureTests());
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
  selectFeatureTests,
};
