const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { calculateFileWeights, loadTimingMap, prepareManifests } = require("./manifest_planner");
const { readTestManifest } = require("./manifest");
const { selectFeatureTests } = require("../run_feature_tests");
const { selectUnitTests } = require("../run_unit_tests");

test("calculateFileWeights uses historical seconds for known files", () => {
  const files = ["app/test/slow_test.exs", "app/test/fast_test.exs"];
  const timings = {
    "test/fast_test.exs": 1,
    "test/slow_test.exs": 10,
  };

  const weights = calculateFileWeights(files, timings, () => 100);

  assert.equal(weights.get("app/test/slow_test.exs"), 10);
  assert.equal(weights.get("app/test/fast_test.exs"), 1);
});

test("calculateFileWeights estimates unknown files in seconds", () => {
  const files = ["app/test/known_one_test.exs", "app/test/known_two_test.exs", "app/test/unknown_test.exs"];
  const sizes = new Map([
    ["app/test/known_one_test.exs", 100],
    ["app/test/known_two_test.exs", 200],
    ["app/test/unknown_test.exs", 300],
  ]);
  const timings = {
    "test/known_one_test.exs": 2,
    "test/known_two_test.exs": 4,
  };

  const weights = calculateFileWeights(files, timings, (file) => sizes.get(file));

  assert.equal(weights.get("app/test/known_one_test.exs"), 2);
  assert.equal(weights.get("app/test/known_two_test.exs"), 4);
  assert.equal(weights.get("app/test/unknown_test.exs"), 6);
});

test("calculateFileWeights falls back entirely to bytes without usable historical timings", () => {
  const files = ["app/test/one_test.exs", "app/test/two_test.exs"];
  const sizes = new Map([
    ["app/test/one_test.exs", 100],
    ["app/test/two_test.exs", 200],
  ]);

  const weights = calculateFileWeights(files, { "test/unrelated_test.exs": 4 }, (file) => sizes.get(file));

  assert.deepEqual(
    [...weights],
    [
      ["app/test/one_test.exs", 100],
      ["app/test/two_test.exs", 200],
    ],
  );
});

test("calculateFileWeights falls back entirely to bytes when matched timings total zero seconds", () => {
  const files = ["app/test/one_test.exs", "app/test/two_test.exs"];
  const sizes = new Map([
    ["app/test/one_test.exs", 100],
    ["app/test/two_test.exs", 200],
  ]);

  const weights = calculateFileWeights(files, { "test/one_test.exs": 0 }, (file) => sizes.get(file));

  assert.deepEqual(
    [...weights],
    [
      ["app/test/one_test.exs", 100],
      ["app/test/two_test.exs", 200],
    ],
  );
});

test("loadTimingMap rejects missing, malformed, unsupported, and empty artifacts", () => {
  withTemporaryDirectory((directory) => {
    assert.throws(() => loadTimingMap(path.join(directory, "missing.json")), /not found/);

    const malformed = writeFile(directory, "malformed.json", "{");
    assert.throws(() => loadTimingMap(malformed), /Invalid timing artifact JSON/);

    const unsupported = writeJson(directory, "unsupported.json", {
      schema_version: 2,
      timings: { "test/a_test.exs": 1 },
    });
    assert.throws(() => loadTimingMap(unsupported), /Unsupported timing artifact schema/);

    const empty = writeJson(directory, "empty.json", { schema_version: 1, timings: {} });
    assert.throws(() => loadTimingMap(empty), /must not be empty/);

    const invalidTiming = writeJson(directory, "invalid-timing.json", {
      schema_version: 1,
      timings: { "test/a_test.exs": -1 },
    });
    assert.throws(() => loadTimingMap(invalidTiming), /Invalid timing/);
  });
});

test("prepareManifests writes a complete disjoint set of unit and feature manifests", () => {
  withTemporaryDirectory((directory) => {
    const unitFiles = ["app/test/one_test.exs", "app/test/two_test.exs"];
    const featureFiles = Array.from({ length: 18 }, (_, index) => `app/test/features/feature_${index + 1}_test.exs`);
    const allFiles = [...unitFiles, ...featureFiles];
    const timingFile = writeJson(directory, "timings.json", {
      schema_version: 1,
      timings: Object.fromEntries(allFiles.map((file, index) => [path.relative("app", file), index + 1])),
    });
    const outputDirectory = path.join(directory, "manifests");

    prepareManifests({
      timingFile,
      outputDirectory,
      unitFiles,
      featureFiles,
      unitShards: 2,
      featureShards: 18,
      fileSize: () => 100,
      log: () => {},
    });

    const manifestNames = fs.readdirSync(outputDirectory).sort();
    assert.equal(manifestNames.length, 20);
    assert.ok(manifestNames.includes("unit-1.txt"));
    assert.ok(manifestNames.includes("unit-2.txt"));
    assert.ok(manifestNames.includes("feature-1.txt"));
    assert.ok(manifestNames.includes("feature-18.txt"));

    const selectedFiles = manifestNames.flatMap((name) => readManifestLines(path.join(outputDirectory, name)));
    assert.equal(new Set(selectedFiles).size, allFiles.length);
    assert.deepEqual(selectedFiles.sort(), allFiles.sort());
  });
});

test("readTestManifest rejects missing, empty, duplicate, and unknown entries", () => {
  withTemporaryDirectory((directory) => {
    const allowedFiles = ["app/test/one_test.exs"];

    assert.throws(() => readTestManifest(path.join(directory, "missing.txt"), allowedFiles), /not found/);

    const empty = writeFile(directory, "empty.txt", "\n");
    assert.throws(() => readTestManifest(empty, allowedFiles), /is empty/);

    const duplicate = writeFile(directory, "duplicate.txt", "app/test/one_test.exs\napp/test/one_test.exs\n");
    assert.throws(() => readTestManifest(duplicate, allowedFiles), /duplicate/);

    const unknown = writeFile(directory, "unknown.txt", "app/test/features/wrong_suite_test.exs\n");
    assert.throws(() => readTestManifest(unknown, allowedFiles), /not part of this test suite/);
  });
});

test("unit and feature runners select exactly the files in their manifests", () => {
  withTemporaryDirectory((directory) => {
    const unitFiles = ["app/test/one_test.exs", "app/test/two_test.exs"];
    const featureFiles = ["app/test/features/one_test.exs", "app/ee/test/features/two_test.exs"];
    const unitManifest = writeFile(directory, "unit.txt", `${unitFiles[1]}\n`);
    const featureManifest = writeFile(directory, "feature.txt", `${featureFiles[0]}\n`);

    assert.deepEqual(selectUnitTests(["node", "run_unit_tests.js", "--manifest", unitManifest], unitFiles), [
      unitFiles[1],
    ]);
    assert.deepEqual(
      selectFeatureTests(["node", "run_feature_tests.js", "--manifest", featureManifest], featureFiles),
      [featureFiles[0]],
    );
  });
});

test("unit and feature runners retain INDEX and TOTAL splitting", () => {
  const unitFiles = ["app/test/a_test.exs", "app/test/b_test.exs"];
  const featureFiles = ["app/test/features/a_test.exs", "app/test/features/b_test.exs"];
  const equalSize = () => 1;

  assert.deepEqual(selectUnitTests(["node", "run_unit_tests.js", "1", "2"], unitFiles, equalSize), [unitFiles[0]]);
  assert.deepEqual(selectFeatureTests(["node", "run_feature_tests.js", "2", "2"], featureFiles, equalSize), [
    featureFiles[1],
  ]);
});

function withTemporaryDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "test-manifests-"));

  try {
    callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
}

function writeJson(directory, name, contents) {
  return writeFile(directory, name, `${JSON.stringify(contents)}\n`);
}

function writeFile(directory, name, contents) {
  const file = path.join(directory, name);
  fs.writeFileSync(file, contents);
  return file;
}

function readManifestLines(file) {
  return fs.readFileSync(file, "utf8").trim().split("\n");
}
