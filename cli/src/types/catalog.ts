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
  unions: Record<string, CatalogTypeRef[]>;
}

export type EndpointKind = "query" | "mutation";

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
}

export interface Catalog {
  schema_version: number;
  api_base_path: string;
  generated_at: string;
  endpoint_count: number;
  query_count: number;
  mutation_count: number;
  types: CatalogTypes;
  endpoints: CatalogEndpoint[];
}
