import type { ShouldRevalidateFunction } from "react-router";
import { legacySearch, readFilters, writeFilters } from "./filters";

export function pilotWorkMapPath(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.has("tab")
    ? writeFilters(url.searchParams, readFilters(url.searchParams))
    : url.searchParams;

  if (url.searchParams.get("tab") !== "projects") search.delete("view");

  url.search = search.toString();

  return url.pathname.replace(/\/$/, "") + "/v2" + url.search;
}

export function legacyWorkMapPath(request: Request) {
  const url = new URL(request.url);
  url.search = legacySearch(url.searchParams).toString();
  return url.pathname.replace(/\/v2\/?$/i, "") + url.search;
}

export const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) return false;
  return defaultShouldRevalidate;
};
