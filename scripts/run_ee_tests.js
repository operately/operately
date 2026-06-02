#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { execSync } = require("child_process");

function findEeTests() {
  const excludedSuites = ["ee/test/features"];

  return fs
    .readdirSync("app/ee/test", { recursive: true })
    .map((f) => path.join("ee/test", f))
    .filter((f) => f.endsWith("_test.exs"))
    .filter((f) => !excludedSuites.some((suite) => f.includes(suite)));
}

function runTests(testFiles) {
  try {
    const testArgs = testFiles.join(" ");

    execSync(`cd app && JUNIT_FINAL_REPORT=junit-ee.xml MIX_ENV=test mix tests_with_retries ${testArgs}`, {
      stdio: "inherit",
    });

    execSync(
      "cd app && MIX_ENV=test mix junit.merge_reports testreports/junit.xml testreports/junit.xml testreports/junit-ee.xml",
      { stdio: "inherit" },
    );

    execSync("cd app && rm -f testreports/junit-ee.xml", { stdio: "inherit" });
  } catch (error) {
    process.exit(1);
  }
}

runTests(findEeTests());
