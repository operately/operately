#!/usr/bin/env node

const path = require("path");
const { execSync } = require("child_process");
const { findTestFiles, parseSplitArgs, splitFiles } = require("./test_file_splitter");

function findUnitTests() {
  const excludedSuites = ["test/features", "test/cli_e2e", "test/mcp_e2e"];
  const split = parseSplitArgs(process.argv);
  const files = findTestFiles(["app/test"], (file) => !excludedSuites.some((suite) => file.includes(suite)));

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

runTests(findUnitTests());
