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
    const reportPath = path.join("app", "testreports", "junit.xml");
    const eeReportPath = path.join("app", "testreports", "junit-ee.xml");

    execSync(`cd app && JUNIT_FINAL_REPORT=junit-ee.xml MIX_ENV=test mix tests_with_retries ${testArgs}`, {
      stdio: "inherit",
    });

    if (fs.existsSync(reportPath)) {
      execSync(
        "cd app && MIX_ENV=test mix junit.merge_reports testreports/junit.xml testreports/junit.xml testreports/junit-ee.xml",
        { stdio: "inherit" },
      );
      fs.rmSync(eeReportPath, { force: true });
    } else {
      fs.renameSync(eeReportPath, reportPath);
    }
  } catch (error) {
    process.exit(1);
  }
}

runTests(findEeTests());
