import type { Catalog, CatalogEndpoint } from "../types/catalog";

export interface EndpointRegistry {
  readonly byKey: Map<string, CatalogEndpoint>;
  readonly endpoints: CatalogEndpoint[];
  find(commandParts: string[]): CatalogEndpoint | null;
  commandFor(endpoint: CatalogEndpoint): string;
}

function endpointKey(endpoint: CatalogEndpoint): string {
  if (endpoint.namespace) return `${endpoint.namespace} ${endpoint.name}`;
  return endpoint.name;
}

export function createRegistry(catalog: Catalog): EndpointRegistry {
  const byKey = new Map<string, CatalogEndpoint>();

  for (const endpoint of catalog.endpoints) {
    const key = endpointKey(endpoint);

    if (byKey.has(key)) {
      throw new Error(`Duplicate command mapping detected for '${key}'`);
    }

    byKey.set(key, endpoint);
  }

  const endpoints = [...catalog.endpoints].sort((left, right) => {
    const leftKey = endpointKey(left);
    const rightKey = endpointKey(right);
    return leftKey.localeCompare(rightKey);
  });

  return {
    byKey,
    endpoints,
    find(commandParts: string[]) {
      if (commandParts.length === 1) {
        return byKey.get(commandParts[0]) ?? null;
      }

      if (commandParts.length === 2) {
        return byKey.get(`${commandParts[0]} ${commandParts[1]}`) ?? null;
      }

      return null;
    },
    commandFor(endpoint: CatalogEndpoint) {
      return endpointKey(endpoint);
    },
  };
}
