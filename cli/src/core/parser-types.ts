import type { CatalogEndpoint } from "../types/catalog";

export class UsageError extends Error {}

export type AuthAction = "login" | "status" | "whoami" | "logout";

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
  | { kind: "auth-help" }
  | { kind: "version" }
  | { kind: "auth"; action: AuthAction; flags: Map<string, unknown[]> }
  | {
      kind: "endpoint";
      commandParts: string[];
      endpoint: CatalogEndpoint;
      endpointInputs: Record<string, unknown>;
      globalFlags: GlobalFlags;
    };
