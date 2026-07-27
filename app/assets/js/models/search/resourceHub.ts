import Api from "@/api";
import * as React from "react";

import { ResourceHubPage } from "turboui";

type SearchParams = { query: string };

export function useResourceHubSearchHandler(resourceHubId: string | null | undefined): ResourceHubPage.SearchFn {
  return React.useCallback(
    async ({ query }: SearchParams) => {
      if (!resourceHubId) {
        throw new Error("Cannot search a resource hub without an ID");
      }

      const response = await Api.resource_hubs.search({ resourceHubId, query });
      return response.nodes;
    },
    [resourceHubId],
  );
}

export function useResourceHubSearchProps(
  resourceHubId: string | null | undefined,
  enabled: boolean,
): ResourceHubPage.SearchProps | undefined {
  const search = useResourceHubSearchHandler(resourceHubId);

  return React.useMemo(
    () =>
      enabled
        ? {
            search,
            placeholder: "Search this resource hub…",
            testId: "resource-hub-search",
          }
        : undefined,
    [enabled, search],
  );
}
