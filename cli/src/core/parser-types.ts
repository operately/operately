import type { CatalogEndpoint } from "../types/catalog";

export class UsageError extends Error {}

export const AUTH_ACTIONS = ["login", "signup", "join", "create-company", "profiles", "status", "whoami", "logout"] as const;

export type AuthAction = (typeof AUTH_ACTIONS)[number];

export interface GlobalFlags {
  token?: string;
  baseUrl?: string;
  profile?: string;
  compact: boolean;
  output?: string;
  verbose: boolean;
}

export type ParsedCommand =
  | { kind: "version" }
  | { kind: "auth"; action: AuthAction; flags: Map<string, unknown[]> }
  | {
      kind: "endpoint";
      commandParts: string[];
      endpoint: CatalogEndpoint;
      endpointInputs: Record<string, unknown>;
      globalFlags: GlobalFlags;
    };
