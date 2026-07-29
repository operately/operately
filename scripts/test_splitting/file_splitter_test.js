const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { splitFiles, splitIntoGroups } = require("./file_splitter");

test("splitIntoGroups balances arbitrary weights", () => {
  const weights = new Map([
    ["slow_test.exs", 8],
    ["medium_test.exs", 5],
    ["small_test.exs", 4],
    ["tiny_test.exs", 3],
  ]);

  const groups = splitIntoGroups([...weights.keys()], 2, (file) => weights.get(file));

  assert.deepEqual(groups, [
    ["slow_test.exs", "tiny_test.exs"],
    ["medium_test.exs", "small_test.exs"],
  ]);
});

test("splitIntoGroups uses paths to break equal-weight ties deterministically", () => {
  const groups = splitIntoGroups(["c_test.exs", "a_test.exs", "b_test.exs"], 2, () => 1);

  assert.deepEqual(groups, [["a_test.exs", "c_test.exs"], ["b_test.exs"]]);
});

test("splitFiles retains byte-size weighting", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "test-file-splitter-"));

  try {
    const large = writeFile(directory, "large_test.exs", 8);
    const medium = writeFile(directory, "medium_test.exs", 5);
    const small = writeFile(directory, "small_test.exs", 3);

    assert.deepEqual(splitFiles([small, large, medium], { index: 0, total: 2 }), [large]);
    assert.deepEqual(splitFiles([small, large, medium], { index: 1, total: 2 }), [medium, small]);
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
});

function writeFile(directory, name, size) {
  const file = path.join(directory, name);
  fs.writeFileSync(file, "x".repeat(size));
  return file;
}
