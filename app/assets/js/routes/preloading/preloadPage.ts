import Api from "@/api";
import AdminApi from "@/ee/admin_api";
import { hashKey } from "@tanstack/react-query";
import { matchRoutes, type RouteMatch, type RouteObject } from "react-router";
import { isPreloadingEnabled, subscribePreloadSession } from "./preloadSession";
import type { PageModule } from "../types";

interface PreloadRouter {
  routes: RouteObject[];
  getLocation: () => URL;
  isNavigating: () => boolean;
}

/** Reuse page data loaders without running navigation or layout effects. */
export function createPagePreloader(router: PreloadRouter) {
  const pending = new Map<string, Promise<void>>();
  const unsubscribe = subscribePreloadSession(() => pending.clear());

  function scope() {
    return hashKey([
      Api.default.getBasePath(),
      Api.default.getHeaders(),
      AdminApi.default.getBasePath(),
      AdminApi.default.getHeaders(),
      window.appConfig.account?.id,
    ]);
  }

  async function preloadPage(href: string): Promise<void> {
    const target = resolvePreloadDestination(href, router);

    if (!target) return;

    const key = hashKey([target.url.href, scope()]);

    if (pending.has(key)) return pending.get(key);
    const promise = (async () => {
      try {
        await target.loader({ params: target.params, request: new Request(target.url) });
      } catch {
        // Navigation retains its own redirects and error handling.
      }
    })();

    pending.set(key, promise);

    try {
      await promise;
    } finally {
      if (pending.get(key) === promise) pending.delete(key);
    }
  }

  return {
    preloadPage,
    isEligible: (href: string) => Boolean(resolvePreloadDestination(href, router)),
    scope,
    dispose: unsubscribe,
  };
}

export type PagePreloader = ReturnType<typeof createPagePreloader>;

/** Resolve a destination only when its URL, route, and company context allow preloading. */
function resolvePreloadDestination(href: string, router: PreloadRouter) {
  if (!isPreloadingEnabled() || router.isNavigating()) return;

  const url = resolvePreloadUrl(href, router.getLocation());
  if (!url) return;

  const page = resolvePreloadRoute(url, router);
  if (!page) return;

  return { url, ...page };
}

/** Accept internal page changes, preserving search parameters but ignoring fragments. */
function resolvePreloadUrl(href: string, current: URL) {
  let url: URL;

  try {
    url = new URL(href, current);
  } catch {
    return;
  }

  if (!/^https?:$/.test(url.protocol) || url.origin !== current.origin) return;
  if (url.pathname === current.pathname && url.search === current.search) return;

  url.hash = "";
  return url;
}

/** Find the page's data loader while honoring inherited exclusions and authentication. */
function resolvePreloadRoute(url: URL, router: PreloadRouter) {
  const matches = matchRoutes(router.routes, url.pathname);
  if (!matches) return;
  if (matches.some(({ route }) => route.handle?.preload === false)) return;

  const requiresAuth = matches.some(({ route }) => route.handle?.auth);
  if (requiresAuth && (!window.appConfig.configured || !window.appConfig.account?.id)) return;
  if (!usesActiveCompany(matches, router)) return;

  const page = matches[matches.length - 1];
  const handle = page?.route.handle as { dataLoader?: PageModule["loader"] } | undefined;
  if (!page || !handle?.dataLoader) return;

  return { params: page.params, loader: handle.dataLoader };
}

/** Company pages must reuse the active route's company and its API headers. */
function usesActiveCompany(matches: RouteMatch[], router: PreloadRouter) {
  // Admin routes can have a companyId parameter without belonging to companyRoot.
  const company = matches.find(({ route }) => route.id === "companyRoot");
  if (!company) return true;

  const activeMatches = matchRoutes(router.routes, router.getLocation().pathname);
  const activeCompany = activeMatches?.find(({ route }) => route.id === "companyRoot");
  if (!activeCompany) return false;

  return (
    activeCompany.params.companyId === company.params.companyId &&
    Api.default.getHeaders()["x-company-id"] === company.params.companyId
  );
}
