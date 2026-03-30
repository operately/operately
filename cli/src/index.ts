#!/usr/bin/env node

import catalogJson from "./generated/api-catalog.json";
import type { Catalog } from "./types/catalog";
import { createRegistry } from "./commands/registry";
import { printAuthHelp, printEndpointHelp, printGeneralHelp, printNamespaceHelp } from "./commands/help";
import { executeAuthCommand } from "./commands/auth";
import { executeEndpointCommand } from "./commands/executor";
import { parseCommand, UsageError } from "./core/parser";
import { printError } from "./core/output";
import { CLI_VERSION } from "./version";

function loadCatalog(rawCatalog: any): Catalog {
  const intEnums: Record<string, number[]> = {};
  for (const [key, values] of Object.entries(rawCatalog.types.int_enums || {})) {
    intEnums[key] = (values as string[]).map(Number);
  }

  return {
    ...rawCatalog,
    types: {
      ...rawCatalog.types,
      int_enums: intEnums,
    },
  } as Catalog;
}

async function main(argv: string[]): Promise<number> {
  const catalog = loadCatalog(catalogJson);
  const registry = createRegistry(catalog);

  let parsed;
  try {
    parsed = parseCommand(argv, registry, catalog.types);
  } catch (error) {
    if (error instanceof UsageError) {
      printError(error.message);
      printError("Run `operately help` to see usage.");
      return 2;
    }

    printError("Unexpected parser error.");
    return 2;
  }

  if (parsed.kind === "help") {
    if (parsed.commandParts.length === 0) {
      printGeneralHelp(registry, catalog.namespace_descriptions || {});
      return 0;
    }

    // Check if this is auth help request (e.g., "help auth")
    if (parsed.commandParts.length === 1 && parsed.commandParts[0] === "auth") {
      printAuthHelp();
      return 0;
    }

    // Check if this is a namespace-specific help request (e.g., "projects help")
    if (parsed.commandParts.length === 1) {
      const namespace = parsed.commandParts[0];
      const namespaces = new Set(registry.endpoints.filter((ep) => ep.namespace).map((ep) => ep.namespace));

      if (namespaces.has(namespace)) {
        printNamespaceHelp(namespace, registry);
        return 0;
      }
    }

    const endpoint = registry.find(parsed.commandParts);
    if (!endpoint) {
      printError(`Unknown command '${parsed.commandParts.join(" ")}'.`);
      return 2;
    }

    printEndpointHelp(endpoint, registry.commandFor(endpoint), catalog.types);
    return 0;
  }

  if (parsed.kind === "version") {
    console.log(CLI_VERSION);
    return 0;
  }

  if (parsed.kind === "auth-help") {
    printAuthHelp();
    return 0;
  }

  if (parsed.kind === "auth") {
    return executeAuthCommand({
      action: parsed.action,
      flags: parsed.flags,
      registry,
    });
  }

  return executeEndpointCommand({
    endpoint: parsed.endpoint,
    globalFlags: parsed.globalFlags,
    endpointInputs: parsed.endpointInputs,
  });
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch(() => {
    printError("Fatal error.");
    process.exitCode = 5;
  });
