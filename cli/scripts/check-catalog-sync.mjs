#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..", "..");
const sourcePath = path.join(repoRoot, "tmp", "generated", "api-docs", "help", "api", "catalog.json");
const targetPath = path.join(repoRoot, "cli", "src", "generated", "api-catalog.json");

if (!fs.existsSync(sourcePath)) {
  console.error(`Catalog not found at ${sourcePath}`);
  console.error("Run `make gen.api.catalog` first.");
  process.exit(1);
}

if (!fs.existsSync(targetPath)) {
  console.error(`CLI catalog not found at ${targetPath}`);
  console.error("Run `make gen.api.catalog` first.");
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const target = JSON.parse(fs.readFileSync(targetPath, "utf8"));

if (JSON.stringify(source) !== JSON.stringify(target)) {
  console.error("Catalog drift detected between generated API docs catalog and CLI catalog.");
  console.error("Run:");
  console.error("  make gen.api.catalog");
  process.exit(1);
}

if (!Array.isArray(target.endpoints)) {
  console.error("CLI catalog is invalid: endpoints is not an array.");
  process.exit(1);
}

if (target.endpoint_count !== target.endpoints.length) {
  console.error(`CLI catalog is invalid: endpoint_count=${target.endpoint_count}, endpoints.length=${target.endpoints.length}.`);
  process.exit(1);
}

const seenCommands = new Set();
for (const endpoint of target.endpoints) {
  const command = endpoint.namespace ? `${endpoint.namespace} ${endpoint.name}` : endpoint.name;
  if (seenCommands.has(command)) {
    console.error(`Duplicate CLI command mapping detected: ${command}`);
    process.exit(1);
  }

  seenCommands.add(command);
}

console.log("Catalog sync check passed.");
