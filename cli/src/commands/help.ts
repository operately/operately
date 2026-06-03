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

Authentication & Setup:
  auth login [--token <token>] [--method <email-password|email-code|google>] [--email <email>] [--password <password>] [--company-id <id>] [--company-name <name>] [--access-mode <read-only|full-access>] [--base-url <url>] [--profile <name>]
  auth signup [--method <email-password|google>] [--full-name <name>] [--email <email>] [--password <password>] [--next-step <create-company|join|later>] [--company-name <name>] [--invite-token <token>] [--base-url <url>] [--profile <name>]
  auth join [--invite-token <token>] [--method <email-password|email-code|google>] [--email <email>] [--password <password>] [--company-id <id>] [--company-name <name>] [--base-url <url>] [--profile <name>]
  auth create-company [--method <email-password|email-code|google>] [--email <email>] [--password <password>] [--company-name <name>] [--base-url <url>] [--profile <name>]
  auth profiles
  auth status [--profile <name>]
  auth whoami [--profile <name>]
  auth logout [--profile <name>]

Global flags:
  --token <token>
  --base-url <url>
  --profile <name>
  --compact
  --json
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
    usage: "operately auth login [--token <token>] [--method <email-password|email-code|google>] [--email <email>] [--password <password>] [--company-id <id>] [--company-name <name>] [--access-mode <read-only|full-access>] [--base-url <url>] [--profile <name>]",
    description: [
      "Log in interactively, with hybrid flags, or with a token",
      "",
      "  1. Hybrid login: run 'operately auth login' with no extra flags for the",
      "     fully interactive flow, or pass any subset of login flags to skip only",
      "     those prompts. Missing values are still asked interactively.",
      "",
      `     If --base-url is omitted, the CLI asks for it and defaults to ${DEFAULT_BASE_URL}.`,
      "     If --method is omitted, the CLI asks whether to use email/password,",
      "     email code, Google OAuth, or a prompted API token.",
      "     If multiple companies are available and neither --company-id nor",
      "     --company-name is provided, the CLI asks which company to use.",
      "     If --access-mode is omitted, the CLI asks whether the token should be",
      "     read-only or full access.",
      "",
      "  2. Quick token mode: run 'operately auth login --token <token>'",
      "     to skip the bootstrap flow and log in directly with an existing token.",
      "     Optionally pass --base-url and --profile to override defaults.",
      "",
      "  Unavoidable manual steps:",
      "    - Google login always requires browser confirmation.",
      "    - Email-code login always sends a verification code that must be entered manually.",
      "",
      "  All other login prompts can be skipped with flags.",
    ],
    flags: [
      "--token <token>                      (quick token mode; cannot be combined with hybrid login flags)",
      "--method <email-password|email-code|google>  (accepted aliases: password, emailCode)",
      "--email <email>                      (email/password and email-code login only)",
      "--password <password>                (email/password login only)",
      "--company-id <id>                    (takes precedence over --company-name)",
      "--company-name <name>                (must match exactly one authenticated company)",
      "--access-mode <read-only|full-access>",
      "--base-url <url>",
      "--profile <name>",
    ],
    examples: [
      "operately auth login",
      "operately auth login --method email-password --email user@example.com --password secret123456 --company-id c123 --access-mode full-access --profile work",
      "operately auth login --method email-code --email user@example.com --company-name \"Acme Corp\" --access-mode read-only",
      "operately auth login --method google --company-name \"Acme Corp\" --access-mode full-access",
      "operately auth login --token op_live_xxx",
      "operately auth login --token op_staging_xxx --profile staging --base-url https://staging.operately.com",
    ],
  },
  signup: {
    usage: "operately auth signup [--method <email-password|google>] [--full-name <name>] [--email <email>] [--password <password>] [--next-step <create-company|join|later>] [--company-name <name>] [--invite-token <token>] [--base-url <url>] [--profile <name>]",
    description: [
      "Create a new account interactively or with flags, then create or join a company",
      "",
      "  Hybrid flow: run 'operately auth signup' with no extra flags for the",
      "  full interactive experience, or pass any subset of signup flags to skip",
      "  only those prompts. Missing values are still asked interactively.",
      "",
      `  If --base-url is omitted, the CLI asks for it and defaults to ${DEFAULT_BASE_URL}.`,
      "  If --method is omitted, the CLI asks whether to use email/password or Google OAuth.",
      "  If --next-step is omitted, the CLI asks whether to create a company, join with an invite token, or stop for now.",
      "",
      "  Unavoidable manual steps:",
      "    - Google signup always requires browser confirmation.",
      "    - Email/password signup always sends a verification code that must be entered manually.",
      "",
      "  All other signup prompts can be skipped with flags.",
      "",
      "  The --profile flag is only used if the flow reaches a point where",
      "  the CLI can save an authenticated profile.",
    ],
    flags: [
      "--method <email-password|google>  (accepted alias: password)",
      "--full-name <name>                (email/password signup only)",
      "--email <email>                   (email/password signup only)",
      "--password <password>             (email/password signup only; skips password confirmation prompt)",
      "--next-step <create-company|join|later>  (accepted alias: join-invite)",
      "--company-name <name>             (used with --next-step create-company)",
      "--invite-token <token>            (used with --next-step join)",
      "--base-url <url>",
      "--profile <name>",
    ],
    examples: [
      "operately auth signup",
      "operately auth signup --method email-password --full-name \"New User\" --email newuser@example.com --password secret123456 --next-step later",
      "operately auth signup --method google --next-step later",
      "operately auth signup --method email-password --full-name \"New User\" --email newuser@example.com --password secret123456 --next-step create-company --company-name \"Acme Corp\" --profile team",
      "operately auth signup --method email-password --full-name \"New User\" --email newuser@example.com --password secret123456 --next-step join --invite-token invite-123 --base-url https://staging.operately.com --profile staging",
    ],
  },
  join: {
    usage: "operately auth join [--invite-token <token>] [--method <email-password|email-code|google>] [--email <email>] [--password <password>] [--company-id <id>] [--company-name <name>] [--base-url <url>] [--profile <name>]",
    description: [
      "Join a company using an invite token",
      "",
      "  Hybrid flow: run 'operately auth join' with no extra flags for the",
      "  fully interactive invite flow, or pass any subset of join flags to skip",
      "  only those prompts. Missing values are still asked interactively.",
      "",
      `  If --base-url is omitted, the CLI asks for it and defaults to ${DEFAULT_BASE_URL}.`,
      "  If --method is omitted, the CLI asks which sign-in method to use after",
      "  the invite has been resolved.",
      "  If the invite already determines the company, any company-selection",
      "  prompt is skipped automatically.",
      "",
      "  Unavoidable manual steps:",
      "    - Google join always requires browser confirmation.",
      "    - Email-code join always sends a verification code that must be entered manually.",
      "",
      "  First-time personal invites only support email/password or Google OAuth.",
      "  All other join prompts can be skipped with flags.",
    ],
    flags: [
      "--invite-token <token>               (skip the invite-token prompt)",
      "--method <email-password|email-code|google>  (accepted aliases: password, emailCode)",
      "--email <email>                      (company-wide joins, or returning personal invites when it matches the invited email)",
      "--password <password>                (password joins only; also skips password confirmation for first-time personal invites)",
      "--company-id <id>                    (takes precedence over --company-name when company selection is needed)",
      "--company-name <name>                (used only when company selection is needed; must match exactly one authenticated company)",
      "--base-url <url>",
      "--profile <name>",
    ],
    examples: [
      "operately auth join",
      "operately auth join --invite-token abc123",
      "operately auth join --invite-token abc123 --method email-password --email user@example.com --password secret123456 --profile team",
      "operately auth join --invite-token abc123 --method email-code --email user@example.com --profile team",
      "operately auth join --invite-token abc123 --method google --profile team",
    ],
  },
  "create-company": {
    usage: "operately auth create-company [--method <email-password|email-code|google>] [--email <email>] [--password <password>] [--company-name <name>] [--base-url <url>] [--profile <name>]",
    description: [
      "Authenticate, create a company, and save a full-access CLI profile",
      "",
      "  Hybrid flow: run 'operately auth create-company' with no extra flags for the",
      "  fully interactive flow, or pass any subset of create-company flags to",
      "  skip only those prompts. Missing values are still asked interactively.",
      "",
      `  If --base-url is omitted, the CLI asks for it and defaults to ${DEFAULT_BASE_URL}.`,
      "  If --method is omitted, the CLI asks which sign-in method to use.",
      "",
      "  Unavoidable manual steps:",
      "    - Google create-company always requires browser confirmation.",
      "    - Email-code create-company always sends a verification code that must be entered manually.",
      "",
      "  All other create-company prompts can be skipped with flags.",
      "",
      "  This command does not accept an API token because company creation",
      "  happens before a company-scoped token exists.",
    ],
    flags: [
      "--method <email-password|email-code|google>  (accepted aliases: password, emailCode)",
      "--email <email>                      (email/password and email-code create-company only)",
      "--password <password>                (email/password create-company only)",
      "--company-name <name>                (skip the company-name prompt)",
      "--base-url <url>",
      "--profile <name>",
    ],
    examples: [
      "operately auth create-company",
      "operately auth create-company --method email-password --email user@example.com --password secret123456 --company-name \"Acme Corp\" --profile team",
      "operately auth create-company --method email-code --email user@example.com --company-name \"Acme Corp\" --profile team",
      "operately auth create-company --method google --company-name \"Acme Corp\" --profile team",
    ],
  },
  profiles: {
    description: [
      "List saved CLI profiles",
      "",
      "  Shows the saved profiles stored in local CLI config, marks the",
      "  active profile, and displays saved login metadata and base URLs.",
      "",
      "  Use `--profile <name>` with any other command to select one of the",
      "  saved profiles explicitly.",
    ],
    usage: "operately auth profiles",
    flags: ["(none)"],
    examples: ["operately auth profiles"],
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

  console.log(`Operately CLI - Authentication & Setup

Usage:
  operately auth <command> [flags]

Available Commands:
${commandLines}

Examples:
${exampleLines}

Use 'operately help auth <command>' for command-specific authentication and setup help.
Use 'operately help' to see all available commands.`);
}

export function printAuthCommandHelp(action: AuthAction): void {
  const help = AUTH_COMMAND_HELP[action];
  const flagLines = help.flags.map((flag) => `  ${flag}`).join("\n");
  const exampleLines = help.examples.map((example) => `  ${example}`).join("\n");

  console.log(`Operately CLI - Authentication & Setup

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

Use 'operately help auth' to see all authentication and setup commands.`);
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

function formatFlagTypeHint(typeRef: CatalogTypeRef): string {
  return typeRef.kind === "list" ? formatTypeHint(typeRef.item) : formatTypeHint(typeRef);
}

function formatFlagQualifiers(field: CatalogEndpoint["inputs"][number]): string {
  const qualifiers = [field.optional ? "optional" : "required"];

  if (field.nullable) qualifiers.push("nullable");
  if (field.type.kind === "list") qualifiers.push("repeatable");

  return qualifiers.join(", ");
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
  const includeTargets: string[] = [];

  const flagRows: string[] =
    endpoint.inputs.length === 0
      ? ["  (none)"]
      : endpoint.inputs.flatMap((field) => {
          const flag = `--${field.name.replace(/_/g, "-")}`;
          const typeHint = formatFlagTypeHint(field.type);
          const rows = [`  ${flag} <${typeHint}> (${formatFlagQualifiers(field)})`];

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
            rows.push(`  ${flag}-file <path> (optional, alternative to ${flag})`);
          }

          if (field.name.startsWith("include_")) {
            includeTargets.push(field.name.replace(/^include_/, ""));
          }

          return rows;
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

  if (includeTargets.length > 0) {
    additionalSections.push("");
    additionalSections.push("Include flag behavior:");
    additionalSections.push("  These flags request extra data in the response.");
    additionalSections.push("  If omitted, that data is not returned.");
    additionalSections.push("  This does not mean the data does not exist; it simply was not preloaded.\n");
    additionalSections.push("  Included resources for this endpoint:");

    for (const target of includeTargets) {
      additionalSections.push(`    - ${target}`);
    }
  }

  if (endpoint.cli_examples && endpoint.cli_examples.length > 0) {
    additionalSections.push("");
    additionalSections.push("Examples:");
    for (const example of endpoint.cli_examples) {
      additionalSections.push(`  ${example}`);
    }
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
  lines.push("  File input: use --<field>-file <path> to load markdown from a file");
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
