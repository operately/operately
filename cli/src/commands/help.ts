import type { CatalogEndpoint, CatalogTypeRef, CatalogTypes } from "../types/catalog";
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
  const namespaceLines = sortedNamespaces
    .map((ns) => {
      const desc = namespaceDescriptions[ns] || `Manage ${ns}`;
      return `  ${ns.padEnd(20)} ${desc}`;
    })
    .join("\n");

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

function formatTypeHint(typeRef: CatalogTypeRef): string {
  if (typeRef.kind === "list") {
    return `[${formatTypeHint(typeRef.item)}]`;
  }
  if (typeRef.name === "json") {
    return "markdown";
  }
  return typeRef.name;
}

export function printEndpointHelp(endpoint: CatalogEndpoint, command: string, types?: CatalogTypes): void {
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

  const enumTypesUsed = new Map<string, string[] | number[]>();
  let hasContextualDate = false;
  let hasContextualDateNullable = false;
  let hasMarkdown = false;

  const flagRows: string[] =
    endpoint.inputs.length === 0
      ? ["  (none)"]
      : endpoint.inputs.map((field) => {
          const flag = `--${field.name.replace(/_/g, "-")}`;
          const required = field.optional ? "optional" : "required";
          const nullable = field.nullable ? ", nullable" : "";
          const typeHint = formatTypeHint(field.type);

          if (field.type.kind === "named" && field.type.name === "contextual_date") {
            hasContextualDate = true;
            if (field.nullable) {
              hasContextualDateNullable = true;
            }
          }

          if (types && field.type.kind === "named") {
            const enumValues = types.enums[field.type.name] || types.int_enums[field.type.name];
            if (enumValues && !enumTypesUsed.has(field.type.name)) {
              enumTypesUsed.set(field.type.name, enumValues);
            }
          }

          if (field.type.kind === "named" && field.type.name === "json") {
            hasMarkdown = true;
          }

          return `  ${flag} <${typeHint}> (${required}${nullable})`;
        });

  const additionalSections: string[] = [];

  if (enumTypesUsed.size > 0) {
    for (const [enumName, enumValues] of enumTypesUsed) {
      additionalSections.push("");
      additionalSections.push(`Allowed values for ${enumName}:`);
      for (const value of enumValues) {
        additionalSections.push(`  ${value}`);
      }
    }
  }

  if (hasMarkdown) {
    additionalSections.push("");
    additionalSections.push(...formatMarkdownHelp());
  }

  if (hasContextualDate) {
    additionalSections.push("");
    additionalSections.push(...formatContextualDateHelp(hasContextualDateNullable));
  }

  console.log([...header, ...flagRows, ...additionalSections].join("\n"));
}

function formatContextualDateHelp(isNullable: boolean): string[] {
  const lines: string[] = [];
  lines.push("Contextual Date Formats:");
  lines.push("  YYYY-MM-DD         Specific day (e.g., 2025-03-20)");
  lines.push("  YYYY               Year end (e.g., 2025 → 31/12/2025)");
  lines.push("  YYYY^              Year start (e.g., 2025^ → 01/01/2025)");
  lines.push("  YYYY/q#            Quarter end (e.g., 2025/q1 → 31/03/2025)");
  lines.push("  YYYY/q#^           Quarter start (e.g., 2025/q1^ → 01/01/2025)");
  lines.push("  YYYY/MM            Month end (e.g., 2025/01 → 31/01/2025)");
  lines.push("  YYYY/MM^           Month start (e.g., 2025/01^ → 01/01/2025)");
  if (isNullable) {
    lines.push("  null               Clear the date");
  }
  return lines;
}

function formatMarkdownHelp(): string[] {
  const lines: string[] = [];
  lines.push("Markdown Format:");
  lines.push("  Supports standard markdown syntax");
  lines.push("  Headings: # H1, ## H2, ### H3");
  lines.push("  Bold: **text**, Italic: *text*");
  lines.push("  Lists: - item or 1. item");
  lines.push("  Links: [text](url)");
  lines.push("  Code: `inline` or ```block```");
  return lines;
}
