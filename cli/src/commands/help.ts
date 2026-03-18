import type { CatalogEndpoint } from "../types/catalog";
import type { EndpointRegistry } from "./registry";

export function printNamespaceHelp(namespace: string, registry: EndpointRegistry): void {
  const endpoints = registry.endpoints.filter((ep) => ep.namespace === namespace);

  if (endpoints.length === 0) {
    console.log(`No commands found in namespace '${namespace}'.`);
    return;
  }

  const commandLines = endpoints
    .map((ep) => ep.name)
    .sort()
    .map((name) => `  ${name}`)
    .join("\n");

  console.log(`Operately CLI - ${namespace} namespace

Available commands:
${commandLines}

Use 'operately help ${namespace} <command>' for command-specific details.`);
}

export function printGeneralHelp(registry: EndpointRegistry): void {
  const namespaces = new Set<string>();
  for (const endpoint of registry.endpoints) {
    if (endpoint.namespace) {
      namespaces.add(endpoint.namespace);
    }
  }

  const sortedNamespaces = Array.from(namespaces).sort();
  const namespaceLines = sortedNamespaces.map((ns) => `  ${ns.padEnd(16)} Manage ${ns}`).join("\n");

  console.log(`Operately CLI

Usage:
  operately <command> [flags]
  operately <namespace> <command> [flags]

Available Commands:
${namespaceLines}

Utility commands:
  auth login --token <token> [--base-url <url>] [--profile <name>]
  auth status [--profile <name>]
  auth whoami [--profile <name>]
  auth logout [--profile <name>]
  help [command]
  version

Global flags:
  --token <token>
  --base-url <url>
  --profile <name>
  --compact
  --output <file>
  --verbose

Endpoint commands available: ${registry.endpoints.length}
Use 'operately help <command>' for command-specific input flags.`);
}

export function printEndpointHelp(endpoint: CatalogEndpoint, command: string): void {
  const header = [
    `Command: ${command}`,
    `Type: ${endpoint.type}`,
    `Method: ${endpoint.method}`,
    `Path: ${endpoint.path}`,
    "",
    "Input flags:",
  ];

  const rows =
    endpoint.inputs.length === 0
      ? ["  (none)"]
      : endpoint.inputs.map((field) => {
          const flag = `--${field.name.replace(/_/g, "-")}`;
          const required = field.optional ? "optional" : "required";
          const nullable = field.nullable ? ", nullable" : "";
          return `  ${flag} (${required}${nullable})`;
        });

  console.log([...header, ...rows].join("\n"));
}
