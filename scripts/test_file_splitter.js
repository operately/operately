const fs = require("fs");
const path = require("path");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseSplitArgs(argv, { required = false } = {}) {
  const rawIndex = argv[2];
  const rawTotal = argv[3];

  if (!rawIndex && !rawTotal) {
    if (required) {
      fail("SPLIT_INDEX and SPLIT_TOTAL must be set");
    }

    return null;
  }

  if (!rawIndex || !rawTotal) {
    fail("SPLIT_INDEX and SPLIT_TOTAL must be set");
  }

  const index = parseInt(rawIndex, 10) - 1;
  const total = parseInt(rawTotal, 10);

  if (isNaN(index)) {
    fail("SPLIT_INDEX must be set");
  }

  if (isNaN(total)) {
    fail("SPLIT_TOTAL must be set");
  }

  if (index < 0) {
    fail("SPLIT_INDEX must be at least 1");
  }

  if (total < 1) {
    fail("SPLIT_TOTAL must be at least 1");
  }

  if (index >= total) {
    fail("SPLIT_INDEX must be less than or equal to SPLIT_TOTAL");
  }

  return { index, total };
}

class FileGroup {
  constructor() {
    this.files = [];
    this.totalSize = 0;
  }

  addFile(file, fileSize) {
    this.files.push(file);
    this.totalSize += fileSize;
  }

  getFiles() {
    return this.files;
  }

  getTotalSize() {
    return this.totalSize;
  }
}

class FileGroupManager {
  constructor(count) {
    this.groups = new Array(count).fill(null).map(() => new FileGroup());
  }

  addFile(file, fileSize) {
    const smallestGroup = this.findSmallestGroup();
    smallestGroup.addFile(file, fileSize);
  }

  findSmallestGroup() {
    return this.groups.reduce((smallest, group) => {
      return group.getTotalSize() < smallest.getTotalSize() ? group : smallest;
    }, this.groups[0]);
  }

  getFilesFromGroup(index) {
    if (index < 0 || index >= this.groups.length) {
      fail("Invalid group index");
    }

    const files = this.groups[index].getFiles();

    if (files.length === 0) {
      fail("No files found for the specified group");
    }

    return files;
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

function splitFiles(files, split) {
  if (!split) {
    return files;
  }

  const groupManager = new FileGroupManager(split.total);

  files
    .map((file) => ({ file, size: fs.statSync(file).size }))
    .sort((a, b) => b.size - a.size)
    .forEach(({ file, size }) => groupManager.addFile(file, size));

  return groupManager.getFilesFromGroup(split.index);
}

module.exports = {
  findTestFiles,
  parseSplitArgs,
  splitFiles,
};
