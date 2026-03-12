#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const catalogPath = path.join(repoRoot, "cli", "src", "generated", "api-catalog.json");
const outputPath = path.join(repoRoot, "cli", "docs", "commands.md");

if (!fs.existsSync(catalogPath)) {
  console.error(`Catalog not found at ${catalogPath}`);
  console.error("Run `make gen.api.catalog` first.");
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const endpoints = Array.isArray(catalog.endpoints) ? catalog.endpoints.slice() : [];

endpoints.sort((a, b) => {
  const left = a.namespace ? `${a.namespace}/${a.name}` : a.name;
  const right = b.namespace ? `${b.namespace}/${b.name}` : b.name;
  return left.localeCompare(right);
});

const rows = endpoints
  .map((endpoint) => {
    const command = endpoint.namespace ? `${endpoint.namespace} ${endpoint.name}` : endpoint.name;
    const shortcut = `op ${command}`;
    return `| \`${command}\` | \`${shortcut}\` | \`${endpoint.method}\` | \`${endpoint.path}\` |`;
  })
  .join("\n");

const content = `# Operately CLI Commands

This file is generated from \`cli/src/generated/api-catalog.json\`.

- Endpoints: ${endpoints.length}
- Mapping rule: root endpoint -> \`<endpoint_name>\`, namespaced endpoint -> \`<namespace> <endpoint_name>\`

| Command | Shortcut | Method | Path |
| --- | --- | --- | --- |
${rows}
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);

console.log(`Generated ${outputPath} with ${endpoints.length} commands.`);
