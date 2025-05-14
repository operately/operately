import { ShouldRevalidateFunction } from "react-router-dom";
import { PageModule } from "@/routes/types";
import { loader } from "./loader";
import { Page } from "./page";

/**
 * Prevents the loader from rerunning when only the search parameters change.
 * This ensures that when users change tabs via URL parameters, we don't reload the data.
 */
const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) {
    return false;
  }

  return defaultShouldRevalidate;
};

export default { name: "SpaceWorkMapPage", loader, Page, shouldRevalidate } as PageModule;
