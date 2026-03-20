import { UsageError } from "./parser-types";
import type { GlobalFlags } from "./parser-types";

const GLOBAL_FLAG_KEYS = new Set(["token", "base-url", "profile", "compact", "output", "verbose"]);

export function parseFlags(tokens: string[]): Map<string, unknown[]> {
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

export function parseGlobalFlags(flags: Map<string, unknown[]>): GlobalFlags {
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

export function isGlobalFlag(key: string): boolean {
  return GLOBAL_FLAG_KEYS.has(key);
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

function ensureStringFlag(name: string, value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  throw new UsageError(`Flag '--${name}' must be a string.`);
}

function ensureBooleanFlag(name: string, value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  throw new UsageError(`Flag '--${name}' must be a boolean.`);
}
