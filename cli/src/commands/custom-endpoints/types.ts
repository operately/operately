import type { Stats } from "node:fs";
import type { GlobalFlags } from "../../core/parser-types";
import type { SignedUploadArgs } from "../../core/uploads/signed-url";
import type { CatalogEndpoint } from "../../types/catalog";
import type { EndpointRegistry } from "../registry";

export interface EndpointCallArgs {
  endpoint: CatalogEndpoint;
  baseUrl: string;
  token: string;
  inputs: Record<string, unknown>;
  timeoutMs: number;
  verbose?: boolean;
}

export interface ExternalMutationArgs {
  baseUrl: string;
  path: string;
  inputs: Record<string, unknown>;
  token: string;
  timeoutMs: number;
  verbose?: boolean;
}

export interface CustomEndpointDeps {
  callEndpoint: (args: EndpointCallArgs) => Promise<unknown>;
  callExternalMutation: (args: ExternalMutationArgs) => Promise<unknown>;
  uploadToSignedUrl: (args: SignedUploadArgs) => Promise<void>;
  readFile: (filePath: string) => Buffer;
  statFile: (filePath: string) => Stats;
  inferMimeType: (filePath: string) => string;
}

export interface CustomEndpointExecutionInput {
  endpoint: CatalogEndpoint;
  endpointInputs: Record<string, unknown>;
  registry: EndpointRegistry;
  runtime: {
    baseUrl: string;
    token: string;
    timeoutMs: number;
  };
  globalFlags: GlobalFlags;
}

export type CustomEndpointExecutor = (
  input: CustomEndpointExecutionInput,
  deps: CustomEndpointDeps,
) => Promise<unknown>;
