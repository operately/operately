import { ShouldRevalidateFunction } from "react-router-dom";

export { Page } from "./page";
export { loader } from "./loader";

/**
 * Prevents the loader from rerunning when only the search parameters change.
 * This ensures that when users change tabs via URL parameters, we don't reload the data.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) {
    return false;
  }

  return defaultShouldRevalidate;
};
