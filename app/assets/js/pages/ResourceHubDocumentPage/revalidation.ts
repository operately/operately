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
  if (currentSearch.get("inlineThread") === nextSearch.get("inlineThread")) return defaultShouldRevalidate;

  // Thread selection uses the loaded list; other query changes retain normal revalidation.
  currentSearch.delete("inlineThread");
  nextSearch.delete("inlineThread");
  currentSearch.sort();
  nextSearch.sort();

  return currentSearch.toString() === nextSearch.toString() ? false : defaultShouldRevalidate;
};
