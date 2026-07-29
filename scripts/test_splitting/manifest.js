const fs = require("fs");

class TestManifestError extends Error {}

function parseManifestPath(argv) {
  const arguments = argv.slice(2);
  const manifestIndexes = arguments.flatMap((argument, index) => (argument === "--manifest" ? [index] : []));

  if (manifestIndexes.length === 0) {
    return null;
  }

  if (manifestIndexes.length > 1) {
    throw new TestManifestError("--manifest may only be provided once");
  }

  const manifestIndex = manifestIndexes[0];
  const manifestPath = arguments[manifestIndex + 1];

  if (!manifestPath || manifestPath.startsWith("--")) {
    throw new TestManifestError("--manifest requires a path");
  }

  if (arguments.length !== 2 || manifestIndex !== 0) {
    throw new TestManifestError("--manifest cannot be combined with INDEX and TOTAL");
  }

  return manifestPath;
}

function readTestManifest(manifestPath, allowedFiles) {
  let contents;

  try {
    contents = fs.readFileSync(manifestPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new TestManifestError(`Test manifest not found: ${manifestPath}`);
    }

    throw error;
  }

  const files = contents
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);

  if (files.length === 0) {
    throw new TestManifestError(`Test manifest is empty: ${manifestPath}`);
  }

  const uniqueFiles = new Set(files);

  if (uniqueFiles.size !== files.length) {
    throw new TestManifestError(`Test manifest contains a duplicate file: ${manifestPath}`);
  }

  const allowedFileSet = new Set(allowedFiles);
  const unknownFile = files.find((file) => !allowedFileSet.has(file));

  if (unknownFile) {
    throw new TestManifestError(`${unknownFile} is not part of this test suite`);
  }

  return files;
}

module.exports = {
  TestManifestError,
  parseManifestPath,
  readTestManifest,
};
