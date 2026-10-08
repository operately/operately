import Api, { ApiClient, type AnalyticsSyncContextInput } from "@/api";
import { queryClient } from "@/api/queryClient";
import { createAnalytics, type AnalyticsContext, type AnalyticsPage, type AnalyticsTracker } from "./browser";
import { registerAnalyticsReset } from "./session";
import type { createBrowserRouter } from "react-router";

let tracker: AnalyticsTracker | undefined;

async function syncContext(context: AnalyticsContext, page: Partial<AnalyticsPage>) {
  const client = createAnalyticsClient(page.companyRef);

  const result = await queryClient
    .getMutationCache()
    .build(queryClient, {
      ...Api.analytics.syncContextMutationOptions(),
      mutationFn: (input: AnalyticsSyncContextInput) => client.apiNamespaceAnalytics.syncContext(input),
      retry: false,
    })
    .execute({ context: JSON.stringify(context) });

  return { ...result, acquisition: JSON.parse(result.acquisition) as Record<string, string> };
}

/** Adds the required CSRF token and isolates workspace headers from later navigation changes. */
function createAnalyticsClient(companyRef?: string) {
  const client = new ApiClient();
  client.setBasePath("/api/v2");

  const csrf = document.querySelector<HTMLMetaElement>("meta[name=csrf-token]")?.content ?? "";
  client.setHeaders({ "x-csrf-token": csrf, ...(companyRef ? { "x-company-id": companyRef } : {}) });

  return client;
}

export function startAnalytics(router: ReturnType<typeof createBrowserRouter>) {
  tracker = createAnalytics(window.appConfig.analytics ?? { enabled: false }, {
    surface: "app",
    accountId: window.appConfig.account?.id,
    syncContext,
  });
  registerAnalyticsReset(() => tracker?.logout());
  let lastKey: string | undefined;
  const track = () => {
    const page = committedPage(router.state);
    if (!page || page.key === lastKey) return;
    lastKey = page.key;
    void tracker?.visit(page).catch(() => {});
  };
  router.subscribe(track);
  track();
}

interface NavigationState {
  initialized: boolean;
  navigation: { state: string };
  location: { pathname: string; search: string };
  matches: { route: { path?: string }; params: Record<string, string | undefined> }[];
}

/** Route definitions contain only static labels and parameter names, never user content. */
export function committedPage(state: NavigationState) {
  if (!state.initialized || state.navigation.state !== "idle") return null;
  const path =
    "/" +
    state.matches
      .map((match) => match.route.path ?? "")
      .join("/")
      .split("/")
      .filter(Boolean)
      .join("/");
  const companyRef = state.matches.find((match) => match.route.path === "/:companyId")?.params.companyId;
  return {
    path: path.replace(/\*/g, ":path"),
    key: state.location.pathname + state.location.search,
    companyRef,
  };
}
