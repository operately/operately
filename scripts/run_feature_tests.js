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
  const index = parseInt(process.argv[2], 10) - 1; // Convert to 0-based index
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

class FileGroup {
  constructor() {
    this.files = [];
    this.totalSize = 0;
  }

  addFile(file) {
    const fileSize = fs.statSync(file).size;
    this.files.push(file);
    this.totalSize += fileSize;
  }

  getFiles() {
    return this.files;
  }

  getTotalSize() {
    return this.totalSize;
  }
}

class FileGroupManager {
  constructor(count) {
    this.groups = new Array(count).fill(null).map(() => new FileGroup());
  }

  addFile(file) {
    const smallestGroup = this.findSmallestGroup();
    smallestGroup.addFile(file);
  }

  findSmallestGroup() {
    return this.groups.reduce((smallest, group) => {
      return group.getTotalSize() < smallest.getTotalSize() ? group : smallest;
    }, this.groups[0]);
  }

  getFilesFromGroup(index) {
    if (index < 0 || index >= this.groups.length) {
      fail("Invalid group index");
    }

    const group = this.groups[index];
    const files = group.getFiles();

    if (files.length === 0) {
      fail("No files found for the specified group");
    }

    return files;
  }
}

function findFeatureTests() {
  const { index, total } = parseSplitIndex();

  const groupManager = new FileGroupManager(total);

  fs.readdirSync("app/test", { recursive: true })
    .map((f) => path.join("app/test", f))
    .filter((f) => f.endsWith("_test.exs"))
    .filter((f) => f.includes("test/features"))
    .forEach((file) => groupManager.addFile(file));

  // Find feature tests in EE
  if (fs.existsSync("app/ee/test")) {
    fs.readdirSync("app/ee/test", { recursive: true })
      .map((f) => path.join("app/ee/test", f))
      .filter((f) => f.endsWith("_test.exs"))
      .filter((f) => f.includes("test/features"))
      .forEach((file) => groupManager.addFile(file));
  }

  return groupManager.getFilesFromGroup(index);
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
