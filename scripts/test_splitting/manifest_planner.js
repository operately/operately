#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { splitIntoGroups } = require("./file_splitter");
const { canonicalTestPath, findFeatureTestFiles, findUnitTestFiles } = require("./suite_files");

const SCHEMA_VERSION = 1;

class ManifestPlannerError extends Error {}

function loadTimingMap(timingFile) {
  let timingArtifact;

  try {
    timingArtifact = JSON.parse(fs.readFileSync(timingFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new ManifestPlannerError(`Timing artifact not found: ${timingFile}`);
    }

    if (error instanceof SyntaxError) {
      throw new ManifestPlannerError(`Invalid timing artifact JSON in ${timingFile}: ${error.message}`);
    }

    throw error;
  }

  if (!timingArtifact || typeof timingArtifact !== "object" || Array.isArray(timingArtifact)) {
    throw new ManifestPlannerError(`Invalid timing artifact in ${timingFile}`);
  }

  if (timingArtifact.schema_version !== SCHEMA_VERSION) {
    throw new ManifestPlannerError(`Unsupported timing artifact schema in ${timingFile}`);
  }

  const timings = timingArtifact.timings;

  if (!timings || typeof timings !== "object" || Array.isArray(timings)) {
    throw new ManifestPlannerError(`Invalid timings map in ${timingFile}`);
  }

  if (Object.keys(timings).length === 0) {
    throw new ManifestPlannerError(`Timings map must not be empty: ${timingFile}`);
  }

  for (const [file, seconds] of Object.entries(timings)) {
    if (!isCanonicalTestPath(file) || !isValidWeight(seconds)) {
      throw new ManifestPlannerError(`Invalid timing for ${JSON.stringify(file)} in ${timingFile}`);
    }
  }

  return timings;
}

/**
 * Known files are weighted by historical runtime. Missing runtimes are estimated
 * from the suite's aggregate seconds-per-byte ratio. If there is no positive
 * timed sample, every file is weighted by bytes so a shard never mixes units.
 */
function calculateFileWeights(files, timings, fileSize = (file) => fs.statSync(file).size) {
  const sizes = new Map(files.map((file) => [file, validatedFileSize(file, fileSize(file))]));
  const knownFiles = files.filter((file) => Object.hasOwn(timings, canonicalTestPath(file)));
  const knownBytes = sum(knownFiles.map((file) => sizes.get(file)));
  const knownSeconds = sum(knownFiles.map((file) => timings[canonicalTestPath(file)]));

  if (knownBytes === 0 || knownSeconds === 0) {
    return sizes;
  }

  const secondsPerByte = knownSeconds / knownBytes;

  return new Map(
    files.map((file) => {
      const historicalSeconds = timings[canonicalTestPath(file)];
      const weight = historicalSeconds === undefined ? sizes.get(file) * secondsPerByte : historicalSeconds;
      return [file, weight];
    }),
  );
}

function prepareManifests({
  timingFile,
  outputDirectory,
  unitFiles = findUnitTestFiles(),
  featureFiles = findFeatureTestFiles(),
  unitShards = 2,
  featureShards = 18,
  fileSize = (file) => fs.statSync(file).size,
  log = console.log,
}) {
  const timings = loadTimingMap(timingFile);
  validateSuitesDoNotOverlap(unitFiles, featureFiles);
  const suites = [
    createSuiteManifests("unit", unitFiles, unitShards, timings, fileSize),
    createSuiteManifests("feature", featureFiles, featureShards, timings, fileSize),
  ];

  fs.mkdirSync(outputDirectory, { recursive: true });

  for (const suite of suites) {
    suite.groups.forEach((files, index) => {
      const shard = index + 1;
      const manifestPath = path.join(outputDirectory, `${suite.name}-${shard}.txt`);
      fs.writeFileSync(manifestPath, `${[...files].sort().join("\n")}\n`);
      log(`${suite.name}-${shard}: ${files.length} files, estimated weight ${formatWeight(suite.weights, files)}`);
    });
  }

  return suites;
}

function validateSuitesDoNotOverlap(unitFiles, featureFiles) {
  const unitFileSet = new Set(unitFiles);
  const overlappingFile = featureFiles.find((file) => unitFileSet.has(file));

  if (overlappingFile) {
    throw new ManifestPlannerError(`${overlappingFile} was discovered in both unit and feature suites`);
  }
}

function createSuiteManifests(name, files, shardCount, timings, fileSize) {
  if (files.length < shardCount) {
    throw new ManifestPlannerError(
      `${name} suite has ${files.length} files, which cannot fill ${shardCount} non-empty shards`,
    );
  }

  const weights = calculateFileWeights(files, timings, fileSize);
  const groups = splitIntoGroups(files, shardCount, (file) => weights.get(file));

  validatePartition(name, files, groups);
  return { name, groups, weights };
}

function validatePartition(suite, files, groups) {
  const expectedFiles = new Set(files);

  if (expectedFiles.size !== files.length) {
    throw new ManifestPlannerError(`${suite} suite discovery returned duplicate files`);
  }

  const selectedFiles = groups.flat();

  if (groups.some((group) => group.length === 0)) {
    throw new ManifestPlannerError(`${suite} suite produced an empty shard`);
  }

  if (new Set(selectedFiles).size !== selectedFiles.length) {
    throw new ManifestPlannerError(`${suite} suite assigned a file to multiple shards`);
  }

  const missingFile = files.find((file) => !selectedFiles.includes(file));
  const unexpectedFile = selectedFiles.find((file) => !expectedFiles.has(file));

  if (missingFile || unexpectedFile || selectedFiles.length !== files.length) {
    throw new ManifestPlannerError(`${suite} manifests do not exactly cover the discovered test files`);
  }
}

function parseArguments(argv) {
  const options = {};
  const arguments = argv.slice(2);

  for (let index = 0; index < arguments.length; index += 2) {
    const option = arguments[index];
    const value = arguments[index + 1];

    if (!option?.startsWith("--") || value === undefined) {
      throw new ManifestPlannerError(
        "Expected --timings PATH --output DIRECTORY --unit-shards NUMBER --feature-shards NUMBER",
      );
    }

    options[option.slice(2)] = value;
  }

  const requiredOptions = ["timings", "output", "unit-shards", "feature-shards"];
  const missingOption = requiredOptions.find((option) => !options[option]);

  if (missingOption) {
    throw new ManifestPlannerError(`Missing required option --${missingOption}`);
  }

  return {
    timingFile: options.timings,
    outputDirectory: options.output,
    unitShards: positiveInteger(options["unit-shards"], "--unit-shards"),
    featureShards: positiveInteger(options["feature-shards"], "--feature-shards"),
  };
}

function positiveInteger(value, option) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    throw new ManifestPlannerError(`${option} must be a positive integer`);
  }

  return number;
}

function validatedFileSize(file, size) {
  if (!isValidWeight(size)) {
    throw new ManifestPlannerError(`Invalid byte size for ${file}: ${size}`);
  }

  return size;
}

function isCanonicalTestPath(file) {
  return (
    typeof file === "string" &&
    file.length > 0 &&
    !path.posix.isAbsolute(file) &&
    path.posix.normalize(file) === file &&
    !file.startsWith("../") &&
    (file.startsWith("test/") || file.startsWith("ee/test/")) &&
    file.endsWith("_test.exs")
  );
}

function isValidWeight(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function formatWeight(weights, files) {
  return sum(files.map((file) => weights.get(file))).toFixed(3);
}

function main() {
  try {
    prepareManifests(parseArguments(process.argv));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ManifestPlannerError,
  calculateFileWeights,
  createSuiteManifests,
  loadTimingMap,
  prepareManifests,
};
