import type { ResourceHubNode } from "../ResourceHub/types";

export type ResourceHubSearchFn = (params: { query: string }) => Promise<ResourceHubNode[]>;

export interface ResourceHubSearchProps {
  search: ResourceHubSearchFn;
  placeholder?: string;
  testId?: string;
}
