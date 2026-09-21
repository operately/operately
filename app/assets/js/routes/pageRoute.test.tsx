/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { reportQueryError } from "@/api/queryErrors";
import { redirect } from "react-router";
import nprogress from "nprogress";
import { setDevData } from "@/features/DevBar/useDevBarData";
import { pageRoute } from "./pageRoute";
import type { PageModule } from "./types";

jest.mock("@/features/DevBar/useDevBarData", () => ({ setDevData: jest.fn() }));
jest.mock("@/api/queryErrors", () => ({ reportQueryError: jest.fn() }));
jest.mock("nprogress", () => ({ start: jest.fn(), done: jest.fn(), isStarted: jest.fn(() => true) }));
jest.mock("react-router", () => ({ redirect: jest.fn((url) => ({ redirect: url })) }));

const request = { params: {}, request: { url: document.URL } };
let page: PageModule;
beforeEach(() => {
  jest.clearAllMocks();
  window.appConfig = { configured: true, account: { id: 1 } } as typeof window.appConfig;
  page = { name: "ExamplePage", Page: () => null, loader: jest.fn(async () => ({ queryInput: {} })) };
});

it("exposes the data loader without navigation effects", async () => {
  page.onNavigate = jest.fn();
  const route = pageRoute("example", page);
  window.appConfig.account = { id: 0 };
  await expect(route.handle.dataLoader(request)).resolves.toEqual({ queryInput: {} });
  expect(route.handle).toMatchObject({ preload: true, auth: true });
  expect(page.onNavigate).not.toHaveBeenCalled();
  expect(nprogress.start).not.toHaveBeenCalled();
  expect(nprogress.done).not.toHaveBeenCalled();
  expect(setDevData).not.toHaveBeenCalled();
  expect(redirect).not.toHaveBeenCalled();
});

it("preserves authentication before navigation effects and fetching", async () => {
  page.onNavigate = jest.fn();
  window.appConfig.account = { id: 0 };
  await expect(pageRoute("example", page).loader(request)).rejects.toEqual({ redirect: expect.any(String) });
  expect(page.onNavigate).not.toHaveBeenCalled();
  expect(page.loader).not.toHaveBeenCalled();
});

it("runs navigation preparation before fetching and records navigation timing", async () => {
  const order: string[] = [];
  page.onNavigate = () => {
    order.push("prepare");
  };
  page.loader = async () => {
    order.push("load");
    return {};
  };
  await pageRoute("example", page).loader(request);
  expect(order).toEqual(["prepare", "load"]);
  expect(nprogress.start).toHaveBeenCalledTimes(1);
  expect(nprogress.done).toHaveBeenCalledTimes(1);
  expect(setDevData).toHaveBeenLastCalledWith({ pageName: page.name, loadTime: expect.any(Number) });
});

it("keeps excluded routes navigable and supports public routes", async () => {
  window.appConfig.account = { id: 0 };
  const route = pageRoute("example", page, { auth: false, preload: false });
  expect(route.handle).toMatchObject({ preload: false, auth: false });
  await expect(route.loader(request)).resolves.toEqual({ queryInput: {} });
});

it("only translates unauthorized errors to login redirects during navigation", async () => {
  const error = { isAxiosError: true, response: { status: 401 } };
  page.loader = jest.fn().mockRejectedValue(error);
  const route = pageRoute("example", page);
  await expect(route.handle.dataLoader(request)).rejects.toBe(error);
  expect(redirect).not.toHaveBeenCalled();
  expect(reportQueryError).not.toHaveBeenCalled();
  await expect(route.loader(request)).rejects.toEqual({ redirect: expect.any(String) });
  expect(nprogress.done).toHaveBeenCalled();
  expect(reportQueryError).toHaveBeenCalledWith(error);
});
