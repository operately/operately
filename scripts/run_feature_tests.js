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
const { execSync } = require("child_process");
const { findTestFiles, parseSplitArgs, splitFiles } = require("./test_file_splitter");

function findFeatureTests() {
  const split = parseSplitArgs(process.argv, { required: true });
  const files = findTestFiles(["app/test", "app/ee/test"], (file) => file.includes("test/features"));

  return splitFiles(files, split);
}

function runTests(testFiles) {
  try {
    const files = testFiles.map((file) => path.relative("app", file));
    const command = `cd app && MIX_ENV=test mix tests_with_retries ${files.join(" ")}`;

    execSync(command, { stdio: "inherit" });
  } catch (error) {
    process.exit(1);
  }
}

runTests(findFeatureTests());
