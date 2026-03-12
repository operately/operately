#!/usr/bin/env node

import catalogJson from "./generated/api-catalog.json";
import type { Catalog } from "./types/catalog";
import { createRegistry } from "./commands/registry";
import { printEndpointHelp, printGeneralHelp } from "./commands/help";
import { executeAuthCommand, executeEndpointCommand } from "./commands/executor";
import { parseCommand, UsageError } from "./core/parser";
import { printError } from "./core/output";
import { CLI_VERSION } from "./version";

async function main(argv: string[]): Promise<number> {
  const catalog = catalogJson as Catalog;
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
      printGeneralHelp(registry);
      return 0;
    }

    const endpoint = registry.find(parsed.commandParts);
    if (!endpoint) {
      printError(`Unknown command '${parsed.commandParts.join(" ")}'.`);
      return 2;
    }

    printEndpointHelp(endpoint, registry.commandFor(endpoint));
    return 0;
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
  });
