import type { CatalogEndpoint } from "../types/catalog";
import type { EndpointRegistry } from "./registry";

export function printGeneralHelp(registry: EndpointRegistry): void {
  console.log(`Operately CLI

Usage:
  operately <command> [flags]
  operately <namespace> <command> [flags]

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

Endpoint command mapping:
  - root endpoint: <endpoint_name>
  - namespaced endpoint: <namespace> <endpoint_name>

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
