import type { CatalogTypes } from "../types/catalog";
import type { EndpointRegistry } from "../commands/registry";
import { UsageError, type ParsedCommand } from "./parser-types";
import { parseFlags, parseGlobalFlags } from "./flags";
import { parseEndpointInputs } from "./input-coercion";
import {
  parseAuthCommand,
  checkForHelpFlag,
  checkForNamespaceHelp,
  checkForTrailingHelp,
  splitCommandAndFlagTokens,
} from "./command-routing";

export { UsageError, type ParsedCommand, type GlobalFlags, type AuthAction } from "./parser-types";

export function parseCommand(argv: string[], registry: EndpointRegistry, types: CatalogTypes): ParsedCommand {
  if (argv.length === 0) {
    return { kind: "help", commandParts: [] };
  }

  if (argv[0] === "help") {
    return { kind: "help", commandParts: argv.slice(1) };
  }

  if (argv[0] === "version" || argv[0] === "--version") {
    return { kind: "version" };
  }

  if (argv[0] === "auth") {
    return parseAuthCommand(argv);
  }

  const trailingHelpCommand = checkForTrailingHelp(argv);
  if (trailingHelpCommand) {
    return trailingHelpCommand;
  }

  const helpCommand = checkForHelpFlag(argv);
  if (helpCommand) {
    return helpCommand;
  }

  const { commandParts, flagTokens } = splitCommandAndFlagTokens(argv);
  if (commandParts.length === 0) {
    throw new UsageError("Missing command.");
  }

  const endpoint = registry.find(commandParts);
  if (!endpoint) {
    if (flagTokens.length === 0) {
      const namespaceHelp = checkForNamespaceHelp(commandParts, registry);
      if (namespaceHelp) {
        return namespaceHelp;
      }
    }

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
