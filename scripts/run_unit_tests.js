#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { execSync } = require("child_process");

function findUnitTests() {
  const excludedSuites = ["test/features", "test/cli_e2e"];

  return fs
    .readdirSync("app/test", { recursive: true })
    .map((f) => path.join("test", f))
    .filter((f) => f.endsWith("_test.exs"))
    .filter((f) => !excludedSuites.some((suite) => f.includes(suite)));
}

function runTests(testFiles) {
  try {
    const command = `cd app && MIX_ENV=test mix tests_with_retries ${testFiles.join(" ")}`;

    execSync(command, { stdio: "inherit" });
  } catch (error) {
    process.exit(1);
  }
}

runTests(findUnitTests());
