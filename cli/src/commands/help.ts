import type { CatalogEndpoint } from "../types/catalog";
import type { EndpointRegistry } from "./registry";

export function printNamespaceHelp(namespace: string, registry: EndpointRegistry): void {
  const endpoints = registry.endpoints.filter((ep) => ep.namespace === namespace);

  if (endpoints.length === 0) {
    console.log(`No commands found in namespace '${namespace}'.`);
    return;
  }

  const sortedEndpoints = endpoints.sort((a, b) => a.name.localeCompare(b.name));
  const maxNameLength = Math.max(...sortedEndpoints.map((ep) => ep.name.length));
  const padding = maxNameLength + 10;

  const commandLines = sortedEndpoints
    .map((ep) => {
      const commandName = ep.name.padEnd(padding);
      const description = ep.docstring || "";
      return `  ${commandName}${description}`;
    })
    .join("\n");

  console.log(`Operately CLI - ${namespace} namespace

Available commands:
${commandLines}

Use 'operately help ${namespace} <command>' for command-specific details.`);
}

export function printGeneralHelp(registry: EndpointRegistry, namespaceDescriptions: Record<string, string>): void {
  const namespaces = new Set<string>();
  for (const endpoint of registry.endpoints) {
    if (endpoint.namespace) {
      namespaces.add(endpoint.namespace);
    }
  }

  const sortedNamespaces = Array.from(namespaces).sort();
  const namespaceLines = sortedNamespaces.map((ns) => {
    const desc = namespaceDescriptions[ns] || `Manage ${ns}`;
    return `  ${ns.padEnd(20)} ${desc}`;
  }).join("\n");

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

Global flags:
  --token <token>
  --base-url <url>
  --profile <name>
  --compact
  --output <file>
  --verbose
  --version
  --help

Endpoint commands available: ${registry.endpoints.length}
Use 'operately help <command>' for command-specific input flags.`);
}

export function printAuthHelp(): void {
  console.log(`Operately CLI - Authentication

Usage:
  operately auth <command> [flags]

Available Commands:
  login                Authenticate with an API token
  status               Show authentication status for current profile
  whoami               Display information about the authenticated user
  logout               Remove authentication credentials from profile

Examples:
  operately auth login --token <token> [--base-url <url>] [--profile <name>]
  operately auth status [--profile <name>]
  operately auth whoami [--profile <name>]
  operately auth logout [--profile <name>]

Use 'operately help' to see all available commands.`);
}

export function printEndpointHelp(endpoint: CatalogEndpoint, command: string): void {
  const header = [`Command: ${command}`];

  if (endpoint.docstring) {
    header.push("");
    header.push(endpoint.docstring);
  }

  header.push("");
  header.push(`Type: ${endpoint.type}`);
  header.push(`Method: ${endpoint.method}`);
  header.push(`Path: ${endpoint.path}`);
  header.push("");
  header.push("Input flags:");

  const rows: string[] =
    endpoint.inputs.length === 0
      ? ["  (none)"]
      : endpoint.inputs.flatMap((field) => {
          const flag = `--${field.name.replace(/_/g, "-")}`;
          const required = field.optional ? "optional" : "required";
          const nullable = field.nullable ? ", nullable" : "";
          const lines: string[] = [];

          lines.push(`  ${flag} (${required}${nullable})`);

          if (field.type.kind === "named" && field.type.name === "contextual_date") {
            lines.push(...formatContextualDateHelp(field.nullable));
          }

          return lines;
        });

  console.log([...header, ...rows].join("\n"));
}

function formatContextualDateHelp(isNullable: boolean): string[] {
  const lines: string[] = [];
  lines.push("    Contextual Date Formats:");
  lines.push("      YYYY-MM-DD         Specific day (e.g., 2025-03-20)");
  lines.push("      YYYY               Year end (e.g., 2025 → 31/12/2025)");
  lines.push("      YYYY^              Year start (e.g., 2025^ → 01/01/2025)");
  lines.push("      YYYY/q#            Quarter end (e.g., 2025/q1 → 31/03/2025)");
  lines.push("      YYYY/q#^           Quarter start (e.g., 2025/q1^ → 01/01/2025)");
  lines.push("      YYYY/MM            Month end (e.g., 2025/01 → 31/01/2025)");
  lines.push("      YYYY/MM^           Month start (e.g., 2025/01^ → 01/01/2025)");
  if (isNullable) {
    lines.push("      null               Clear the date");
  }
  return lines;
}