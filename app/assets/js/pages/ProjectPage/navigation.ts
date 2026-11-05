import type { ShouldRevalidateFunction } from "react-router";

export const shouldRevalidate: ShouldRevalidateFunction = ({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (formMethod || currentUrl.pathname !== nextUrl.pathname) return defaultShouldRevalidate;

  const currentSearch = new URLSearchParams(currentUrl.search);
  const nextSearch = new URLSearchParams(nextUrl.search);
  // Tabs and task panels use data already loaded by the page. Rerunning the
  // loader here can race with mutation/live refetches that cancel its queries.
  const viewParams = ["tab", "taskId"];
  if (viewParams.every((param) => currentSearch.get(param) === nextSearch.get(param))) return defaultShouldRevalidate;

  viewParams.forEach((param) => {
    currentSearch.delete(param);
    nextSearch.delete(param);
  });
  currentSearch.sort();
  nextSearch.sort();

  return currentSearch.toString() === nextSearch.toString() ? false : defaultShouldRevalidate;
};
