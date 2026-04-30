import type { CatalogEndpoint, CatalogTypeRef, CatalogTypes } from "../types/catalog";
import { AUTH_ACTIONS, type AuthAction } from "../core/parser-types";
import { DEFAULT_BASE_URL } from "../auth/config";
import type { EndpointRegistry } from "./registry";

export function printNamespaceHelp(namespace: string, registry: EndpointRegistry): void {
  const endpoints = registry.endpoints.filter((ep: CatalogEndpoint) => ep.namespace === namespace);

  if (endpoints.length === 0) {
    console.log(`No commands found in namespace '${namespace}'.`);
    return;
  }

  const sortedEndpoints = endpoints.sort((a: CatalogEndpoint, b: CatalogEndpoint) => a.name.localeCompare(b.name));
  const maxNameLength = Math.max(...sortedEndpoints.map((ep: CatalogEndpoint) => ep.name.length));
  const padding = maxNameLength + 10;

  const commandLines = sortedEndpoints
    .map((ep: CatalogEndpoint) => {
      const padded = ep.name.padEnd(maxNameLength + 1);
      const shortDesc = ep.docstring ? ` - ${ep.docstring}` : "";
      return `  ${padded} ${shortDesc}`;
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
  auth login [--token <token>] [--base-url <url>] [--profile <name>]
  auth signup [--base-url <url>] [--profile <name>]
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

interface AuthCommandHelp {
  description: string | string[];
  usage: string;
  flags: string[];
  examples: string[];
}

const AUTH_COMMAND_HELP: Record<AuthAction, AuthCommandHelp> = {
  login: {
    usage: "operately auth login [--token <token>] [--base-url <url>] [--profile <name>]",
    description: [
      "Log in interactively or with a token",
      "",
      "  1. Interactive mode: run 'operately auth login' and follow prompts.",
      `     You will be asked for a base URL (default: ${DEFAULT_BASE_URL}),`,
      "     a profile name (default: default), and an authentication method",
      "     (email/password, Google OAuth, or existing API token).",
      "",
      "  2. Quick token mode: run 'operately auth login --token <token>'",
      "     to skip prompts and log in directly with a token.",
      "     Optionally pass --base-url and --profile to override defaults.",
    ],
    flags: [
      "--token <token>       (skip interactive flow and use an existing token)",
      "--base-url <url>",
      "--profile <name>",
    ],
    examples: [
      "operately auth login",
      "operately auth login --token op_live_xxx",
      "operately auth login --token op_staging_xxx --profile staging --base-url https://staging.operately.com",
    ],
  },
  signup: {
    usage: "operately auth signup [--base-url <url>] [--profile <name>]",
    description: [
      "Sign up and create a new company on an empty instance",
      "",
      "  Interactive flow: run 'operately auth signup' and follow prompts.",
      `     You will be asked for a base URL (default: ${DEFAULT_BASE_URL}),`,
      "     a profile name (default: default), your email, a verification",
      "     code, full name, password, and company name.",
    ],
    flags: [
      "--base-url <url>",
      "--profile <name>",
    ],
    examples: [
      "operately auth signup",
      "operately auth signup --base-url https://staging.operately.com --profile staging",
    ],
  },
  join: {
    usage: "operately auth join --invite-token <token> [--base-url <url>] [--profile <name>]",
    description: [
      "Join a company using an invite token",
      "",
      "  Interactive flow: run 'operately auth join' and follow prompts.",
      "     You will be asked for an invite token, base URL, profile name,",
      "     and authentication method (email+password or Google OAuth).",
    ],
    flags: [
      "--invite-token <token>  (skip prompt and use this token directly)",
      "--base-url <url>",
      "--profile <name>",
    ],
    examples: [
      "operately auth join",
      "operately auth join --invite-token abc123",
      "operately auth join --invite-token abc123 --base-url https://staging.operately.com --profile staging",
    ],
  },
  status: {
    description: "Show authentication status for current profile",
    usage: "operately auth status [--profile <name>]",
    flags: ["--profile <name>"],
    examples: ["operately auth status", "operately auth status --profile staging"],
  },
  whoami: {
    description: "Display information about the authenticated user",
    usage: "operately auth whoami [--profile <name>]",
    flags: ["--profile <name>"],
    examples: ["operately auth whoami", "operately auth whoami --profile staging"],
  },
  logout: {
    description: "Remove authentication credentials from profile",
    usage: "operately auth logout [--profile <name>]",
    flags: ["--profile <name>"],
    examples: ["operately auth logout", "operately auth logout --profile staging"],
  },
};

export function printAuthHelp(): void {
  const commandLines = AUTH_ACTIONS.map((action) => {
    const helpEntry = AUTH_COMMAND_HELP[action];
    const description = Array.isArray(helpEntry.description) ? helpEntry.description[0] : helpEntry.description;
    return `  ${action.padEnd(20)} ${description}`;
  }).join("\n");

  const exampleLines = AUTH_ACTIONS.map((action) => `  ${AUTH_COMMAND_HELP[action].usage}`).join("\n");

  console.log(`Operately CLI - Authentication

Usage:
  operately auth <command> [flags]

Available Commands:
${commandLines}

Examples:
${exampleLines}

Use 'operately help auth <command>' for command-specific authentication help.
Use 'operately help' to see all available commands.`);
}

export function printAuthCommandHelp(action: AuthAction): void {
  const help = AUTH_COMMAND_HELP[action];
  const flagLines = help.flags.map((flag) => `  ${flag}`).join("\n");
  const exampleLines = help.examples.map((example) => `  ${example}`).join("\n");

  console.log(`Operately CLI - Authentication

Command:
  auth ${action}

Description:
  ${Array.isArray(help.description) ? help.description.join("\n  ") : help.description}

Usage:
  ${help.usage}

Flags:
${flagLines}

Examples:
${exampleLines}

Use 'operately help auth' to see all authentication commands.`);
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
  const objectTypesUsed = new Set<string>();
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

            const objectType = types.objects[field.type.name];
            if (objectType && !objectTypesUsed.has(field.type.name) && field.type.name !== "contextual_date") {
              objectTypesUsed.add(field.type.name);
            }
          }

          if (types && field.type.kind === "list" && field.type.item.kind === "named") {
            const objectType = types.objects[field.type.item.name];
            if (
              objectType &&
              !objectTypesUsed.has(field.type.item.name) &&
              field.type.item.name !== "contextual_date"
            ) {
              objectTypesUsed.add(field.type.item.name);
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

  if (objectTypesUsed.size > 0 && types) {
    for (const objectTypeName of objectTypesUsed) {
      additionalSections.push("");
      const objectHelp = formatObjectTypeHelp(objectTypeName, types);
      additionalSections.push(...objectHelp);

      // Check if any fields in this object type use contextual_date
      const objectType = types.objects[objectTypeName];
      if (objectType) {
        for (const field of objectType.fields) {
          if (field.type.kind === "named" && field.type.name === "contextual_date") {
            hasContextualDate = true;
            if (field.nullable) {
              hasContextualDateNullable = true;
            }
          }
        }
      }
    }
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

function formatObjectTypeHelp(typeName: string, types: CatalogTypes): string[] {
  const lines: string[] = [];
  const objectType = types.objects[typeName];

  if (!objectType) {
    return lines;
  }

  lines.push(`Fields for object '${typeName}':`);

  const enumsInObject = new Map<string, string[] | number[]>();

  for (const field of objectType.fields) {
    const fieldName = field.name;
    const typeHint = formatTypeHint(field.type);
    const required = field.optional ? "optional" : "required";
    const nullable = field.nullable ? ", nullable" : "";
    lines.push(`  ${fieldName}: <${typeHint}> (${required}${nullable})`);

    if (field.type.kind === "named") {
      const enumValues = types.enums[field.type.name] || types.int_enums[field.type.name];
      if (enumValues && !enumsInObject.has(field.type.name)) {
        enumsInObject.set(field.type.name, enumValues);
      }
    }
  }

  if (enumsInObject.size > 0) {
    for (const [enumName, enumValues] of enumsInObject) {
      lines.push("");
      lines.push(`Allowed values for ${enumName}:`);
      for (const value of enumValues) {
        lines.push(`  ${value}`);
      }
    }
  }

  return lines;
}
