import * as React from "react";

import { searchResultPath } from "@/models/search/searchResultPath";
import { useCompanySearch } from "@/models/search/useCompanySearch";
import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { SearchPage as SearchPageView } from "turboui";
import { loader } from "./loader";

export default { name: "SearchPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const search = useCompanySearch();

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
    />
  );
}
