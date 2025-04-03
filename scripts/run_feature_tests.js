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

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseSplitIndex() {
  const index = parseInt(process.argv[2], 10);
  const total = parseInt(process.argv[3], 10);

  if (isNaN(index)) {
    fail("TEST_SPLIT_INDEX must be set");
  }

  if (isNaN(total)) {
    fail("TEST_SPLIT_TOTAL must be set");
  }

  if (total < 1) {
    fail("SPLIT_TOTAL must be at least 1");
  }

  if (index > total) {
    fail("SPLIT_INDEX must be less than or equal to SPLIT_TOTAL");
  }

  return { index, total };
}

function findFeatureTests() {
  const { index, total } = parseSplitIndex();

  const files = fs
    .readdirSync("app/test", { recursive: true })
    .map((f) => path.join("test", f))
    .filter((f) => f.endsWith("_test.exs"))
    .filter((f) => f.includes("test/features"))
    .sort((a, b) => {
      const fileSizeA = fs.statSync(path.join("app", a)).size;
      const fileSizeB = fs.statSync(path.join("app", b)).size;

      return fileSizeA - fileSizeB;
    });

  const filesPerGroup = Math.ceil(files.length / total);
  const start = (index - 1) * filesPerGroup;

  return files.slice(start, start + filesPerGroup);
}

function runTests(testFiles) {
  try {
    const command = `cd app && mix tests_with_retries ${testFiles.join(" ")}`;

    execSync(command, { stdio: "inherit" });
  } catch (error) {
    process.exit(1);
  }
}

runTests(findFeatureTests());
