#!/usr/bin/env node

import catalogJson from "./generated/api-catalog.json";
import type { Catalog } from "./types/catalog";
import { createRegistry } from "./commands/registry";
import { handleHelpRequest } from "./commands/help-handler";
import { executeAuthCommand } from "./auth";
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

  const helpExitCode = handleHelpRequest({
    argv,
    registry,
    types: catalog.types,
    namespaceDescriptions: catalog.namespace_descriptions || {},
  });

  if (helpExitCode !== null) {
    return helpExitCode;
  }

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

  if (parsed.kind === "version") {
    console.log(CLI_VERSION);
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
  })
  .finally(() => {
    releaseStandardInput();
  });

function releaseStandardInput(): void {
  process.stdin.pause();
  process.stdin.unref?.();
}
