import type { CatalogEndpoint, CatalogField, CatalogTypeRef, CatalogTypes } from "../types/catalog";
import type { EndpointRegistry } from "../commands/registry";

export class UsageError extends Error {}

type AuthAction = "login" | "status" | "whoami" | "logout";

export interface GlobalFlags {
  token?: string;
  baseUrl?: string;
  profile?: string;
  compact: boolean;
  output?: string;
  verbose: boolean;
}

export type ParsedCommand =
  | { kind: "help"; commandParts: string[] }
  | { kind: "version" }
  | { kind: "auth"; action: AuthAction; flags: Map<string, unknown[]> }
  | {
      kind: "endpoint";
      commandParts: string[];
      endpoint: CatalogEndpoint;
      endpointInputs: Record<string, unknown>;
      globalFlags: GlobalFlags;
    };

const BUILTIN_TYPES = new Set(["string", "integer", "float", "boolean", "date", "time", "datetime"]);
const GLOBAL_FLAG_KEYS = new Set(["token", "base-url", "profile", "compact", "output", "verbose"]);

export function parseCommand(argv: string[], registry: EndpointRegistry, types: CatalogTypes): ParsedCommand {
  if (argv.length === 0) return { kind: "help", commandParts: [] };

  if (argv[0] === "help") {
    return { kind: "help", commandParts: argv.slice(1) };
  }

  if (argv[0] === "version" || argv[0] === "--version") {
    return { kind: "version" };
  }

  if (argv[0] === "auth") {
    const action = argv[1];

    if (!action || !["login", "status", "whoami", "logout"].includes(action)) {
      throw new UsageError("Invalid auth command. Use: auth <login|status|whoami|logout>");
    }

    const flags = parseFlags(argv.slice(2));
    return { kind: "auth", action: action as AuthAction, flags };
  }

  const { commandParts, flagTokens } = splitCommandAndFlagTokens(argv);
  if (commandParts.length === 0) throw new UsageError("Missing command.");

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

function splitCommandAndFlagTokens(argv: string[]): { commandParts: string[]; flagTokens: string[] } {
  const firstFlagIndex = argv.findIndex((arg) => arg.startsWith("--"));
  if (firstFlagIndex === -1) return { commandParts: argv, flagTokens: [] };

  return {
    commandParts: argv.slice(0, firstFlagIndex),
    flagTokens: argv.slice(firstFlagIndex),
  };
}

function parseFlags(tokens: string[]): Map<string, unknown[]> {
  const flags = new Map<string, unknown[]>();

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("--")) {
      throw new UsageError(`Unexpected token '${token}'. Flags must start with '--'.`);
    }

    if (token.startsWith("--no-")) {
      const key = token.slice("--no-".length);
      addFlag(flags, key, false);
      continue;
    }

    const equalsIndex = token.indexOf("=");
    if (equalsIndex > -1) {
      const key = token.slice(2, equalsIndex);
      const value = token.slice(equalsIndex + 1);
      addFlag(flags, key, parseLiteral(value));
      continue;
    }

    const key = token.slice(2);
    const next = tokens[i + 1];

    if (!next || next.startsWith("--")) {
      addFlag(flags, key, true);
      continue;
    }

    addFlag(flags, key, parseLiteral(next));
    i += 1;
  }

  return flags;
}

function parseLiteral(value: string): unknown {
  if (value === "null") return null;
  return value;
}

function addFlag(flags: Map<string, unknown[]>, key: string, value: unknown): void {
  const existing = flags.get(key) ?? [];
  existing.push(value);
  flags.set(key, existing);
}

function parseGlobalFlags(flags: Map<string, unknown[]>): GlobalFlags {
  const globalFlags: GlobalFlags = {
    compact: false,
    verbose: false,
  };

  for (const [key, values] of flags.entries()) {
    if (!GLOBAL_FLAG_KEYS.has(key)) continue;

    const last = values[values.length - 1];

    if (key === "token") globalFlags.token = ensureStringFlag("token", last);
    if (key === "base-url") globalFlags.baseUrl = ensureStringFlag("base-url", last);
    if (key === "profile") globalFlags.profile = ensureStringFlag("profile", last);
    if (key === "output") globalFlags.output = ensureStringFlag("output", last);
    if (key === "compact") globalFlags.compact = ensureBooleanFlag("compact", last);
    if (key === "verbose") globalFlags.verbose = ensureBooleanFlag("verbose", last);
  }

  return globalFlags;
}

function parseEndpointInputs(endpoint: CatalogEndpoint, flags: Map<string, unknown[]>, types: CatalogTypes): Record<string, unknown> {
  const rawInputs: Record<string, unknown> = {};
  const fieldNames = new Set(endpoint.inputs.map((field) => field.name));

  for (const [flagKey, values] of flags.entries()) {
    if (GLOBAL_FLAG_KEYS.has(flagKey)) continue;

    const normalizedPath = flagKey.split(".").map(normalizePathSegment);
    const topLevel = normalizedPath[0];

    if (!fieldNames.has(topLevel)) {
      throw new UsageError(`Unknown input flag '--${flagKey}' for command '${endpoint.name}'.`);
    }

    for (const value of values) {
      rawInputs[topLevel] = setPathValue(rawInputs[topLevel], normalizedPath.slice(1), value);
    }
  }

  return coerceEndpointInputs(endpoint.inputs, rawInputs, types);
}

function normalizePathSegment(segment: string): string {
  if (/^\d+$/.test(segment)) return segment;
  return segment.replace(/-/g, "_");
}

function setPathValue(currentValue: unknown, path: string[], newValue: unknown): unknown {
  if (path.length === 0) {
    if (currentValue === undefined) return newValue;
    if (Array.isArray(currentValue)) return [...currentValue, newValue];
    return [currentValue, newValue];
  }

  const [head, ...tail] = path;
  if (/^\d+$/.test(head)) {
    const index = Number(head);
    const list = Array.isArray(currentValue) ? [...currentValue] : [];
    list[index] = setPathValue(list[index], tail, newValue);
    return list;
  }

  const objectValue =
    currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
      ? { ...(currentValue as Record<string, unknown>) }
      : {};

  objectValue[head] = setPathValue(objectValue[head], tail, newValue);
  return objectValue;
}

function coerceEndpointInputs(fields: CatalogField[], raw: Record<string, unknown>, types: CatalogTypes): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const knownFields = new Set(fields.map((field) => field.name));

  for (const key of Object.keys(raw)) {
    if (!knownFields.has(key)) {
      throw new UsageError(`Unknown input field '${key}'.`);
    }
  }

  for (const field of fields) {
    const value = raw[field.name];

    if (value === undefined) {
      if (field.has_default) {
        output[field.name] = field.default;
        continue;
      }

      if (!field.optional) {
        throw new UsageError(`Missing required field '${field.name}'.`);
      }

      continue;
    }

    const coerced = coerceFieldValue(field.type, value, field, types, field.name);
    output[field.name] = coerced;
  }

  return output;
}

function coerceObjectFields(
  fields: CatalogField[],
  value: unknown,
  types: CatalogTypes,
  path: string,
): Record<string, unknown> | null {
  if (value === null) return null;
  if (!isPlainObject(value)) throw new UsageError(`Field '${path}' must be an object.`);

  const rawValue = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  for (const key of Object.keys(rawValue)) {
    if (!fieldByName.has(key)) {
      throw new UsageError(`Unknown nested field '${path}.${key}'.`);
    }
  }

  for (const field of fields) {
    const fieldPath = `${path}.${field.name}`;
    const rawField = rawValue[field.name];

    if (rawField === undefined) {
      if (field.has_default) {
        result[field.name] = field.default;
        continue;
      }

      if (!field.optional) {
        throw new UsageError(`Missing required field '${fieldPath}'.`);
      }

      continue;
    }

    result[field.name] = coerceFieldValue(field.type, rawField, field, types, fieldPath);
  }

  return result;
}

function coerceFieldValue(
  type: CatalogTypeRef,
  value: unknown,
  field: Pick<CatalogField, "nullable">,
  types: CatalogTypes,
  path: string,
): unknown {
  if (value === null) {
    if (!field.nullable) {
      throw new UsageError(`Field '${path}' cannot be null.`);
    }

    return null;
  }

  if (type.kind === "list") {
    const list = Array.isArray(value) ? value : [value];
    return list.map((entry, index) => coerceFieldValue(type.item, entry, { nullable: false }, types, `${path}[${index}]`));
  }

  const typeName = type.name;

  if (BUILTIN_TYPES.has(typeName)) {
    return coerceBuiltin(typeName, value, path);
  }

  if (types.enums[typeName]) {
    if (Array.isArray(value) || value === undefined || value === null) {
      throw new UsageError(`Field '${path}' must be one of: ${types.enums[typeName].join(", ")}.`);
    }

    const enumValue = String(value);
    if (!types.enums[typeName].includes(enumValue)) {
      throw new UsageError(`Field '${path}' must be one of: ${types.enums[typeName].join(", ")}.`);
    }

    return enumValue;
  }

  if (types.primitives[typeName]) {
    const primitiveType = types.primitives[typeName];
    if (primitiveType.encoded_type) {
      return coerceFieldValue({ kind: "named", name: primitiveType.encoded_type }, value, { nullable: false }, types, path);
    }

    return value;
  }

  if (types.objects[typeName]) {
    return coerceObjectFields(types.objects[typeName].fields, value, types, path);
  }

  if (types.unions[typeName]) {
    return value;
  }

  return value;
}

function coerceBuiltin(typeName: string, value: unknown, path: string): unknown {
  if (Array.isArray(value)) throw new UsageError(`Field '${path}' does not accept multiple values.`);

  if (typeName === "string" || typeName === "date" || typeName === "time" || typeName === "datetime") {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    throw new UsageError(`Field '${path}' must be a string.`);
  }

  if (typeName === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      if (value === "true") return true;
      if (value === "false") return false;
    }

    throw new UsageError(`Field '${path}' must be a boolean.`);
  }

  if (typeName === "integer") {
    if (typeof value === "number" && Number.isInteger(value)) return value;
    if (typeof value === "string" && /^-?\d+$/.test(value)) return Number.parseInt(value, 10);
    throw new UsageError(`Field '${path}' must be an integer.`);
  }

  if (typeName === "float") {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) return Number.parseFloat(value);
    throw new UsageError(`Field '${path}' must be a float.`);
  }

  return value;
}

function ensureStringFlag(flagName: string, value: unknown): string {
  if (typeof value !== "string") throw new UsageError(`Flag '--${flagName}' must be a string.`);
  return value;
}

function ensureBooleanFlag(flagName: string, value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  throw new UsageError(`Flag '--${flagName}' must be a boolean.`);
}

function isPlainObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
