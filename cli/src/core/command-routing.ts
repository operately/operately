import type { EndpointRegistry } from "../commands/registry";
import { UsageError, type ParsedCommand, type AuthAction } from "./parser-types";
import { parseFlags } from "./flags";

export function parseAuthCommand(argv: string[]): ParsedCommand {
  const action = argv[1];

  if (!action || action === "--help") {
    return { kind: "auth-help" };
  }

  if (!["login", "status", "whoami", "logout"].includes(action)) {
    throw new UsageError("Invalid auth command. Use: auth <login|status|whoami|logout>");
  }

  const flags = parseFlags(argv.slice(2));
  return { kind: "auth", action: action as AuthAction, flags };
}

export function checkForHelpFlag(argv: string[]): ParsedCommand | null {
  const helpFlagIndex = argv.findIndex((arg) => arg === "--help");
  if (helpFlagIndex !== -1) {
    const commandParts = argv.slice(0, helpFlagIndex);
    return { kind: "help", commandParts };
  }
  return null;
}

export function checkForNamespaceHelp(commandParts: string[], registry: EndpointRegistry): ParsedCommand | null {
  if (commandParts.length === 1) {
    const namespace = commandParts[0];
    const namespaces = new Set(registry.endpoints.filter((ep) => ep.namespace).map((ep) => ep.namespace));
    
    if (namespaces.has(namespace)) {
      return { kind: "help", commandParts: [namespace] };
    }
  }
  return null;
}

export function splitCommandAndFlagTokens(argv: string[]): { commandParts: string[]; flagTokens: string[] } {
  const firstFlagIndex = argv.findIndex((arg) => arg.startsWith("--"));
  if (firstFlagIndex === -1) return { commandParts: argv, flagTokens: [] };

  return {
    commandParts: argv.slice(0, firstFlagIndex),
    flagTokens: argv.slice(firstFlagIndex),
  };
}
