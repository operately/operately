import { createBrowserRouter, matchRoutes, type RouteObject } from "react-router";
import { createAppRoutes } from "./index";
import { companyLoader } from "./companyLoader";

jest.mock("@/pages", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_, name) => ({ name, Page: () => null, loader: jest.fn() }) }),
}));
jest.mock("@/ee/pages", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_, name) => ({ name, Page: () => null, loader: jest.fn() }) }),
}));
jest.mock("@/features/DevBar/useDevBarData", () => ({ setDevData: jest.fn() }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ CurrentCompanyProvider: () => null }));
jest.mock("@/contexts/TimezoneContext", () => ({ TimezoneProvider: () => null }));
jest.mock("@/layouts/CompanyLayout", () => () => null);
jest.mock("@/layouts/NonCompanyLayout", () => () => null);
jest.mock("@/ee/layouts/SaasAdminLayout", () => () => null);
jest.mock("./ErrorPage", () => () => null);
jest.mock("./companyLoader", () => ({ companyLoader: jest.fn() }));

function routes(): RouteObject[] {
  const createRouter = jest.fn();
  createAppRoutes(createRouter as unknown as typeof createBrowserRouter);
  return createRouter.mock.calls[0][0];
}

it.each([
  "/company-import",
  "/setup",
  "/billing/pick-company",
  "/join",
  "/join/token",
  "/join/token/full",
  "/acme/invite-team",
  "/acme/admin/billing",
  "/acme/admin/billing/plans",
  "/acme/admin/billing/cancel",
])("excludes %s from speculative loading without removing its navigation loader", (url) => {
  const matches = matchRoutes(routes(), url);
  expect(matches).not.toBeNull();
  const route = matches?.at(-1)?.route;
  expect(route?.handle.preload).toBe(false);
  expect(route?.loader).toEqual(expect.any(Function));
});

it.each([
  "/acme",
  "/acme/work-map",
  "/acme/spaces/space",
  "/acme/projects/project?tab=tasks",
  "/acme/goals/goal",
  "/admin/email-settings",
])("exposes data loaders for eligible routes such as %s", (url) => {
  const matches = matchRoutes(routes(), url);
  expect(matches?.at(-1)?.route.handle.preload).toBe(true);
  expect(matches?.some(({ route }) => route.handle?.preload === false)).toBe(false);
  expect(matches?.at(-1)?.route.handle.dataLoader).toEqual(expect.any(Function));
});

it("keeps the company layout loader exclusive to navigation", () => {
  const route = routes().find(({ id }) => id === "companyRoot");
  expect(route?.loader).toBe(companyLoader);
  expect(route).toBeDefined();
  expect(route?.handle?.dataLoader).toBeUndefined();
});
