import AdminApi from "@/ee/admin_api";
import axios from "axios";
import { showErrorToast } from "turboui";
import { createPagePreloader } from "./preloadPage";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { disablePreloading } from "./preloadSession";

jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

const dataLoader = jest.fn(async (_args: any): Promise<void> => undefined);
const navigationLoader = jest.fn();

const routes = [
  { path: "/lobby", handle: { dataLoader } },
  { path: "/admin/companies/:companyId", handle: { dataLoader } },
  {
    id: "companyRoot",
    path: "/:companyId",
    loader: navigationLoader,
    children: [
      { path: "home" },
      { path: "projects/:id", handle: { dataLoader, auth: true } },
      { path: "excluded", handle: { dataLoader, preload: false } },
      { path: "parent", handle: { preload: false }, children: [{ path: "child", handle: { dataLoader } }] },
    ],
  },
];

let location = "/acme/home";
let navigating = false;

const preloader = () =>
  createPagePreloader({
    routes,
    getLocation: () => new URL(location, "http://localhost"),
    isNavigating: () => navigating,
  });

beforeEach(() => {
  jest.clearAllMocks();
  dataLoader.mockImplementation(async () => undefined);
  queryClient.clear();
  Api.default.setBasePath("/api/v2");
  AdminApi.default.setBasePath("/admin/api/v1");
  Api.default.setHeaders({ "x-company-id": "acme" });
  global.window = { appConfig: { configured: true, account: { id: 1 } } } as any;
  location = "/acme/home";
  navigating = false;
});

afterEach(() => queryClient.clear());

it("calls only the page data loader with parameters and search intact", async () => {
  const service = preloader();
  await service.preloadPage("/acme/projects/one?tab=tasks#top");
  expect(dataLoader).toHaveBeenCalledWith({ params: { companyId: "acme", id: "one" }, request: expect.any(Request) });
  expect(dataLoader.mock.calls[0]?.[0].request.url).toBe("http://localhost/acme/projects/one?tab=tasks");
  expect(navigationLoader).not.toHaveBeenCalled();
  service.dispose();
});

it.each([
  "https://elsewhere.com/acme/projects/one",
  "mailto:hi@test.com",
  "/other/projects/one",
  "/acme/home#top",
  "/acme/excluded",
  "/acme/parent/child",
  "/missing/route",
])("skips %s", async (href) => {
  const service = preloader();
  await service.preloadPage(href);
  expect(dataLoader).not.toHaveBeenCalled();
  service.dispose();
});

it("skips company cards from the lobby but not enterprise company parameters", async () => {
  location = "/lobby";
  const service = preloader();
  await service.preloadPage("/acme/projects/one");
  expect(dataLoader).not.toHaveBeenCalled();
  await service.preloadPage("/admin/companies/other");
  expect(dataLoader).toHaveBeenCalledTimes(1);
  service.dispose();
});

it("deduplicates pending URLs, ignores fragments, and retries finished loaders", async () => {
  let finish: () => void = () => {};
  dataLoader.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const service = preloader();
  const first = service.preloadPage("/acme/projects/one#first");
  const second = service.preloadPage("/acme/projects/one#second");
  expect(dataLoader).toHaveBeenCalledTimes(1);
  finish();
  await Promise.all([first, second]);
  await service.preloadPage("/acme/projects/one");
  expect(dataLoader).toHaveBeenCalledTimes(2);
  service.dispose();
});

it("absorbs loader failures and redirects", async () => {
  const service = preloader();
  dataLoader.mockRejectedValueOnce(new Error("unavailable"));
  await expect(service.preloadPage("/acme/projects/one")).resolves.toBeUndefined();
  dataLoader.mockRejectedValueOnce(new Response(null, { status: 302, headers: { Location: "/login" } }));
  await expect(service.preloadPage("/acme/projects/one")).resolves.toBeUndefined();
  service.dispose();
});

it("shares pending and completed cache entries with navigation, then refreshes invalidated data", async () => {
  let finish: (value: string) => void = () => {};
  const queryFn = jest.fn(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const options = { queryKey: ["page"], queryFn, staleTime: Infinity };
  dataLoader.mockImplementation(async () => {
    await queryClient.fetchQuery(options);
  });
  const service = preloader();
  const preload = service.preloadPage("/acme/projects/one");
  const navigation = dataLoader({});
  expect(queryFn).toHaveBeenCalledTimes(1);
  finish("ready");
  await Promise.all([preload, navigation]);
  await dataLoader({});
  expect(queryFn).toHaveBeenCalledTimes(1);
  await queryClient.invalidateQueries({ queryKey: options.queryKey });
  queryFn.mockResolvedValueOnce("fresh");
  await dataLoader({});
  expect(queryFn).toHaveBeenCalledTimes(2);
  service.dispose();
});

it("skips authentication failures, active navigation, and mismatched company headers", async () => {
  const service = preloader();
  window.appConfig.account = { id: 0 };
  await service.preloadPage("/acme/projects/one");
  window.appConfig.account = { id: 1 };
  navigating = true;
  await service.preloadPage("/acme/projects/one");
  navigating = false;
  Api.default.setHeaders({ "x-company-id": "other" });
  await service.preloadPage("/acme/projects/one");
  expect(dataLoader).not.toHaveBeenCalled();
  service.dispose();
});

it("does not toast, reload, or write session storage for a stale-client preload failure", async () => {
  const reload = jest.fn();
  Object.defineProperty(window, "location", { configurable: true, value: { reload } });
  const storage = { getItem: jest.fn(), setItem: jest.fn() };
  Object.defineProperty(global, "sessionStorage", { configurable: true, value: storage });
  const request = jest.spyOn(axios, "get").mockRejectedValueOnce({
    isAxiosError: true,
    response: { status: 410, headers: { "x-operately-version": "new" } },
  });
  dataLoader.mockImplementation(async () => {
    await Api.projects.getQuery({ id: "one" });
  });
  const service = preloader();
  await service.preloadPage("/acme/projects/one");
  expect(showErrorToast).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();
  expect(storage.setItem).not.toHaveBeenCalled();
  request.mockRestore();
  service.dispose();
  Reflect.deleteProperty(global, "sessionStorage");
});

it("disables future preloads after authentication changes", async () => {
  const service = preloader();
  disablePreloading();
  await service.preloadPage("/acme/projects/one");
  expect(dataLoader).not.toHaveBeenCalled();
  service.dispose();
});
