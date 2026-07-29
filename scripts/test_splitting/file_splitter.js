const fs = require("fs");
const path = require("path");

class TestFileSplitterError extends Error {}

function parseSplitArgs(argv, { required = false } = {}) {
  const rawIndex = argv[2];
  const rawTotal = argv[3];

  if (!rawIndex && !rawTotal) {
    if (required) {
      throw new TestFileSplitterError("SPLIT_INDEX and SPLIT_TOTAL must be set");
    }

    return null;
  }

  if (!rawIndex || !rawTotal) {
    throw new TestFileSplitterError("SPLIT_INDEX and SPLIT_TOTAL must be set");
  }

  const oneBasedIndex = Number(rawIndex);
  const total = Number(rawTotal);

  if (!Number.isInteger(oneBasedIndex)) {
    throw new TestFileSplitterError("SPLIT_INDEX must be an integer");
  }

  if (!Number.isInteger(total)) {
    throw new TestFileSplitterError("SPLIT_TOTAL must be an integer");
  }

  const index = oneBasedIndex - 1;

  if (index < 0) {
    throw new TestFileSplitterError("SPLIT_INDEX must be at least 1");
  }

  if (total < 1) {
    throw new TestFileSplitterError("SPLIT_TOTAL must be at least 1");
  }

  if (index >= total) {
    throw new TestFileSplitterError("SPLIT_INDEX must be less than or equal to SPLIT_TOTAL");
  }

  return { index, total };
}

class FileGroup {
  constructor() {
    this.files = [];
    this.totalWeight = 0;
  }

  addFile(file, weight) {
    this.files.push(file);
    this.totalWeight += weight;
  }

  getFiles() {
    return this.files;
  }

  getTotalWeight() {
    return this.totalWeight;
  }
}

class FileGroupManager {
  constructor(count) {
    this.groups = new Array(count).fill(null).map(() => new FileGroup());
  }

  addFile(file, weight) {
    const smallestGroup = this.findSmallestGroup();
    smallestGroup.addFile(file, weight);
  }

  findSmallestGroup() {
    return this.groups.reduce((smallest, group) => {
      return group.getTotalWeight() < smallest.getTotalWeight() ? group : smallest;
    }, this.groups[0]);
  }

  getGroups() {
    return this.groups.map((group) => group.getFiles());
  }
}

function findTestFiles(roots, predicate) {
  return roots.flatMap((root) => {
    if (!fs.existsSync(root)) {
      return [];
    }

    return fs
      .readdirSync(root, { recursive: true })
      .map((file) => path.join(root, file))
      .filter((file) => file.endsWith("_test.exs"))
      .filter(predicate);
  });
}

function splitFiles(files, split, weightForFile = (file) => fs.statSync(file).size) {
  if (!split) {
    return files;
  }

  const groups = splitIntoGroups(files, split.total, weightForFile);
  const selectedFiles = groups[split.index];

  if (!selectedFiles) {
    throw new TestFileSplitterError("Invalid group index");
  }

  if (selectedFiles.length === 0) {
    throw new TestFileSplitterError("No files found for the specified group");
  }

  return selectedFiles;
}

function splitIntoGroups(files, groupCount, weightForFile) {
  if (!Number.isInteger(groupCount) || groupCount < 1) {
    throw new TestFileSplitterError("Group count must be a positive integer");
  }

  const weightedFiles = files.map((file) => {
    const weight = weightForFile(file);

    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0) {
      throw new TestFileSplitterError(`Invalid weight for ${file}: ${weight}`);
    }

    return { file, weight };
  });

  const groupManager = new FileGroupManager(groupCount);

  weightedFiles
    .sort((left, right) => right.weight - left.weight || left.file.localeCompare(right.file))
    .forEach(({ file, weight }) => groupManager.addFile(file, weight));

  return groupManager.getGroups();
}

module.exports = {
  TestFileSplitterError,
  findTestFiles,
  parseSplitArgs,
  splitFiles,
  splitIntoGroups,
};
