const { findTestFiles } = require("./file_splitter");

const EXCLUDED_UNIT_SUITES = ["test/features", "test/cli_e2e", "test/mcp_e2e"];

function findUnitTestFiles() {
  return findTestFiles(["app/test"], (file) => {
    const canonicalFile = canonicalPath(file);
    return !EXCLUDED_UNIT_SUITES.some((suite) => canonicalFile.includes(suite));
  });
}

function findFeatureTestFiles() {
  return findTestFiles(["app/test", "app/ee/test"], (file) => canonicalPath(file).includes("test/features"));
}

function canonicalTestPath(file) {
  const canonicalFile = canonicalPath(file);

  if (!canonicalFile.startsWith("app/")) {
    throw new Error(`Test file must be inside app: ${file}`);
  }

  return canonicalFile.slice("app/".length);
}

function canonicalPath(file) {
  return file.replaceAll("\\", "/");
}

module.exports = {
  canonicalTestPath,
  findFeatureTestFiles,
  findUnitTestFiles,
};
