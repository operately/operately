import type { CatalogEndpoint, CatalogTypes } from "../types/catalog";
import { AUTH_ACTIONS, type AuthAction } from "../core/parser-types";
import { splitCommandAndFlagTokens } from "../core/command-routing";
import { printError } from "../core/output";
import {
  printAuthCommandHelp,
  printAuthHelp,
  printEndpointHelp,
  printGeneralHelp,
  printNamespaceHelp,
} from "./help";
import type { EndpointRegistry } from "./registry";

export type HelpRequest =
  | { kind: "general" }
  | { kind: "auth-overview" }
  | { kind: "auth-command"; action: AuthAction }
  | { kind: "namespace"; namespace: string }
  | { kind: "endpoint"; endpoint: CatalogEndpoint }
  | { kind: "unknown"; commandParts: string[] };

interface HelpHandlerInput {
  argv: string[];
  registry: EndpointRegistry;
  types: CatalogTypes;
  namespaceDescriptions: Record<string, string>;
}

export function handleHelpRequest(input: HelpHandlerInput): number | null {
  const request = resolveHelpRequest(input.argv, input.registry);
  if (!request) {
    return null;
  }

  if (request.kind === "general") {
    printGeneralHelp(input.registry, input.namespaceDescriptions);
    return 0;
  }

  if (request.kind === "auth-overview") {
    printAuthHelp();
    return 0;
  }

  if (request.kind === "auth-command") {
    printAuthCommandHelp(request.action);
    return 0;
  }

  if (request.kind === "namespace") {
    printNamespaceHelp(request.namespace, input.registry);
    return 0;
  }

  if (request.kind === "endpoint") {
    printEndpointHelp(request.endpoint, input.registry.commandFor(request.endpoint), input.types);
    return 0;
  }

  printError(`Unknown command '${request.commandParts.join(" ")}'.`);
  return 2;
}

export function resolveHelpRequest(argv: string[], registry: EndpointRegistry): HelpRequest | null {
  const commandParts = extractHelpCommandParts(argv, registry);
  if (!commandParts) {
    return null;
  }

  if (commandParts.length === 0) {
    return { kind: "general" };
  }

  if (commandParts[0] === "auth") {
    if (commandParts.length === 1) {
      return { kind: "auth-overview" };
    }

    if (commandParts.length === 2 && AUTH_ACTIONS.includes(commandParts[1] as AuthAction)) {
      return { kind: "auth-command", action: commandParts[1] as AuthAction };
    }

    return { kind: "unknown", commandParts };
  }

  if (commandParts.length === 1 && isNamespace(commandParts[0], registry)) {
    return { kind: "namespace", namespace: commandParts[0] };
  }

  const endpoint = registry.find(commandParts);
  if (endpoint) {
    return { kind: "endpoint", endpoint };
  }

  return { kind: "unknown", commandParts };
}

function extractHelpCommandParts(argv: string[], registry: EndpointRegistry): string[] | null {
  if (argv.length === 0) {
    return [];
  }

  if (argv[0] === "help" || argv[0] === "--help") {
    return argv.slice(1);
  }

  if (argv.length === 1) {
    if (argv[0] === "auth") {
      return ["auth"];
    }

    if (isNamespace(argv[0], registry)) {
      return [argv[0]];
    }
  }

  const trailingHelpCommandParts = extractTrailingHelpCommandParts(argv);
  if (trailingHelpCommandParts) {
    return trailingHelpCommandParts;
  }

  return extractInlineHelpCommandParts(argv);
}

function extractTrailingHelpCommandParts(argv: string[]): string[] | null {
  if (argv.length === 0 || argv.at(-1) !== "help") {
    return null;
  }

  if (argv.some((arg, index) => index !== argv.length - 1 && arg.startsWith("--"))) {
    return null;
  }

  return argv.slice(0, -1);
}

function extractInlineHelpCommandParts(argv: string[]): string[] | null {
  const helpFlagIndex = argv.findIndex((arg) => arg === "--help");
  if (helpFlagIndex === -1) {
    return null;
  }

  if (helpFlagIndex === 0) {
    return argv.slice(1);
  }

  const { commandParts, flagTokens } = splitCommandAndFlagTokens(argv);
  if (!flagTokens.includes("--help")) {
    return null;
  }

  return commandParts;
}

function isNamespace(command: string, registry: EndpointRegistry): boolean {
  return registry.endpoints.some((endpoint) => endpoint.namespace === command);
}
