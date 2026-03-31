import type { CatalogTypes } from "../types/catalog";
import type { EndpointRegistry } from "../commands/registry";
import { UsageError, type ParsedCommand } from "./parser-types";
import { parseFlags, parseGlobalFlags } from "./flags";
import { parseEndpointInputs } from "./input-coercion";
import {
  parseAuthCommand,
  splitCommandAndFlagTokens,
} from "./command-routing";

export { UsageError, AUTH_ACTIONS, type ParsedCommand, type GlobalFlags, type AuthAction } from "./parser-types";

export function parseCommand(argv: string[], registry: EndpointRegistry, types: CatalogTypes): ParsedCommand {
  if (argv[0] === "version" || argv[0] === "--version") {
    return { kind: "version" };
  }

  if (argv[0] === "auth") {
    return parseAuthCommand(argv);
  }

  const { commandParts, flagTokens } = splitCommandAndFlagTokens(argv);
  if (commandParts.length === 0) {
    throw new UsageError("Missing command.");
  }

  const endpoint = registry.find(commandParts);
  if (!endpoint) {
    throw new UsageError(`Unknown command '${commandParts.join(" ")}'.`);
  }

  const parsedFlags = parseFlags(flagTokens);
  const globalFlags = parseGlobalFlags(parsedFlags);
  const endpointInputs = parseEndpointInputs(endpoint, parsedFlags, types);

  return {
    kind: "endpoint",
    commandParts,
    endpoint,
    endpointInputs,
    globalFlags,
  };
}
