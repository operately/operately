import Api from "@/api";
import { useQuerySearch } from "./useQuerySearch";
import * as React from "react";

import { ResourceHubPage } from "turboui";

type SearchParams = { query: string };

function useResourceHubSearchHandler(resourceHubId: string | null | undefined): ResourceHubPage.SearchFn {
  const search = useQuerySearch(
    ({ query }: SearchParams) => Api.resource_hubs.searchQueryOptions({ resourceHubId: resourceHubId ?? "", query }),
    { query: "" },
  );

  return React.useCallback(
    async ({ query }: SearchParams) => {
      if (!resourceHubId) {
        throw new Error("Cannot search a resource hub without an ID");
      }

      const response = await search({ query });
      return response.nodes;
    },
    [resourceHubId, search],
  );
}

export function useResourceHubSearchProps(
  resourceHubId: string | null | undefined,
): ResourceHubPage.SearchProps | undefined {
  const search = useResourceHubSearchHandler(resourceHubId);

  return React.useMemo(
    () =>
      resourceHubId
        ? {
            search,
            placeholder: "Search documents and files…",
            testId: "resource-hub-search",
          }
        : undefined,
    [resourceHubId, search],
  );
}
