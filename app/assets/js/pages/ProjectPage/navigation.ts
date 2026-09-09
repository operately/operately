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
  if (currentSearch.get("tab") === nextSearch.get("tab")) return defaultShouldRevalidate;

  currentSearch.delete("tab");
  nextSearch.delete("tab");
  currentSearch.sort();
  nextSearch.sort();

  return currentSearch.toString() === nextSearch.toString() ? false : defaultShouldRevalidate;
};
