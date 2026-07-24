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
