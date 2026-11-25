import axios from "axios";
import { createMemoryRouter } from "react-router";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import companyPage from "@/pages/CompanyWorkMapPage";
import spacePage from "@/pages/SpaceWorkMapPage";
import workMapPage from "./index";
import { pageRoute } from "@/routes/pageRoute";

jest.mock("@/pages/CompanyWorkMapPage/page", () => ({ Page: () => null }));
jest.mock("@/pages/SpaceWorkMapPage/page", () => ({ Page: () => null }));
jest.mock("axios");
jest.mock("nprogress", () => ({ start: jest.fn(), isStarted: () => false }));
jest.mock("@/features/DevBar/useDevBarData", () => ({ setDevData: jest.fn() }));
jest.mock("@/components/Pages", () => ({}));
jest.mock("@/routes/paths", () => ({}));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({}));
jest.mock("turboui", () => ({}));

const home = "http://localhost/acme";
const get = jest.mocked(axios.get);

beforeEach(() => {
  Object.defineProperty(global, "window", {
    configurable: true,
    value: { location: new URL(home), appConfig: { configured: true, account: { id: "me" } } },
  });
  Object.defineProperty(global, "document", { configurable: true, value: { URL: home } });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "acme" });
  get.mockReset().mockImplementation(async (url) => {
    if (url.endsWith("/companies/get"))
      return { data: { company: { id: "acme", enabled_experimental_features: ["work_map_v2"] } } };
    if (url.endsWith("/work_maps/get_settings"))
      return { data: { can_edit: true, default_view: null, ordered_item_ids: [], pinned_kpis: [] } };
    if (url.endsWith("/companies/get_work_map")) return { data: { work_map: [] } };
    if (url.endsWith("/spaces/get")) return { data: { space: { id: "product", name: "Product" } } };
    throw new Error("Unexpected request " + url);
  });
});

afterEach(() => queryClient.clear());

it.each([
  ["work-map", "/acme/work-map", {}, companyPage],
  ["spaces/:id/work-map", "/acme/spaces/product/work-map", { id: "product" }, spacePage],
] as const)(
  "reuses the preloaded %s hierarchy when opening and filtering the map",
  async (path, href, params, entryPage) => {
    const route = pageRoute(path, entryPage);
    const router = createMemoryRouter(
      [{ path: "/:companyId", children: [{ index: true }, route, pageRoute(path + "/v2", workMapPage)] }],
      {
        initialEntries: ["/acme"],
      },
    );
    const mapRequests = () => get.mock.calls.filter(([url]) => url.endsWith("/get_work_map"));

    const settingsRequests = () => get.mock.calls.filter(([url]) => url.endsWith("/work_maps/get_settings"));

    try {
      await route.handle.dataLoader({ params, request: new Request(new URL(href, home)) });
      expect(mapRequests()).toHaveLength(1);
      await router.navigate(href);
      expect(router.state.errors).toBeNull();
      const mapPath = href + "/v2";
      expect(router.state.location.pathname).toBe(mapPath);
      await router.navigate(mapPath + "?lifecycle=closed");
      expect(router.state.errors).toBeNull();
      expect(router.state.location.pathname + router.state.location.search).toBe(mapPath + "?lifecycle=closed");
      expect(mapRequests()).toHaveLength(1);
      expect(settingsRequests()).toHaveLength(1);

      await router.navigate("/acme");
      await router.navigate(mapPath);
      expect(settingsRequests()).toHaveLength(2);
      expect(mapRequests()).toHaveLength(1);
    } finally {
      router.dispose();
    }
  },
);
