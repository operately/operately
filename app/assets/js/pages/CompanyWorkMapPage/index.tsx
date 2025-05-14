import { PageModule } from "@/routes/types";
import { ShouldRevalidateFunction } from "react-router-dom";

import { Page } from "./page";
import { loader } from "./loader";

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

export default { name: "CompanyWorkMapPage", loader, Page, shouldRevalidate } as PageModule;
