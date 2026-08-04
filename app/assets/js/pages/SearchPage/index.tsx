import * as React from "react";

import Api from "@/api";
import * as Pages from "@/components/Pages";
import { searchResultPath } from "@/models/search/searchResultPath";
import { useCompanySearch } from "@/models/search/useCompanySearch";
import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { SearchPage as SearchPageView } from "turboui";

interface LoaderResult {
  spaces: Array<{ id: string; name: string }>;
}

export default { name: "SearchPage", loader, Page } as PageModule;

async function loader(): Promise<LoaderResult> {
  const spaces = await Api.spaces.list({}).then((result) => result.spaces ?? []);

  return {
    spaces: spaces.flatMap((space) => {
      if (!space.id || !space.name) return [];
      return [{ id: space.id, name: space.name }];
    }),
  };
}

function Page() {
  const paths = usePaths();
  const { spaces } = Pages.useLoadedData<LoaderResult>();
  const search = useCompanySearch(spaces);

  const results = React.useMemo<SearchPageView.Result[]>(
    () =>
      search.results.flatMap((result) => {
        const link = searchResultPath(paths, result);
        return link ? [{ ...result, link }] : [];
      }),
    [paths, search.results],
  );

  return (
    <SearchPageView
      query={search.query}
      status={search.status}
      results={results}
      onQueryChange={search.onQueryChange}
      refine={search.refine}
    />
  );
}
