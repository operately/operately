export interface CatalogTypeRefList {
  kind: "list";
  item: CatalogTypeRef;
}

export interface CatalogTypeRefNamed {
  kind: "named";
  name: string;
}

export type CatalogTypeRef = CatalogTypeRefList | CatalogTypeRefNamed;

export interface CatalogField {
  name: string;
  type: CatalogTypeRef;
  optional: boolean;
  nullable: boolean;
  has_default: boolean;
  default: unknown;
}

export interface CatalogPrimitiveType {
  encoded_type: string | null;
}

export interface CatalogObjectType {
  fields: CatalogField[];
}

export interface CatalogTypes {
  primitives: Record<string, CatalogPrimitiveType>;
  objects: Record<string, CatalogObjectType>;
  enums: Record<string, string[]>;
  int_enums: Record<string, number[]>;
  unions: Record<string, CatalogTypeRef[]>;
}

export type EndpointKind = "query" | "mutation";
export type EndpointExecutionMode = "generic" | "custom";
export type EndpointExampleMode = "curl" | "cli" | "none";

export interface CatalogEndpoint {
  full_name: string;
  namespace: string | null;
  name: string;
  type: EndpointKind;
  method: "GET" | "POST";
  path: string;
  handler: string;
  inputs: CatalogField[];
  outputs: CatalogField[];
  docstring: string | null;
  execution_mode?: EndpointExecutionMode;
  example_mode?: EndpointExampleMode;
  cli_examples?: string[];
}

export interface Catalog {
  schema_version: number;
  api_base_path: string;
  endpoint_count: number;
  query_count: number;
  mutation_count: number;
  types: CatalogTypes;
  endpoints: CatalogEndpoint[];
  namespace_descriptions?: Record<string, string>;
}
