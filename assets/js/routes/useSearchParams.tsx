import React from "react";
import { useRouter } from "./Router";

type URLSearchParamsInit = string | Record<string, string> | URLSearchParams;

export function useSearchParams() {
  const router = useRouter();

  const searchParams = React.useMemo(() => new URLSearchParams(router.location.search), [router.location.search]);

  const setSearchParams = React.useCallback(
    (nextInit: URLSearchParamsInit) => {
      const newSearchParams = createSearchParams(nextInit);
      const searchString = newSearchParams.toString();
      const newPathname = router.location.pathname + (searchString ? `?${searchString}` : "");

      router.navigate(newPathname);
    },
    [router],
  );

  return [searchParams, setSearchParams] as const;
}

function createSearchParams(init: URLSearchParamsInit = "") {
  if (init instanceof URLSearchParams) {
    return init;
  }

  if (typeof init === "object") {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(init)) {
      params.append(key, value);
    }
    return params;
  }

  return new URLSearchParams(init);
}
