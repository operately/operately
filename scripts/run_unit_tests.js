#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { execSync } = require("child_process");

function findUnitTests() {
  return fs
    .readdirSync("app/test", { recursive: true })
    .map((f) => path.join("test", f))
    .filter((f) => f.endsWith("_test.exs"))
    .filter((f) => !f.includes("test/features"));
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
