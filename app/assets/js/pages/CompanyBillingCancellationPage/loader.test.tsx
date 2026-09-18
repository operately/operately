/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { loader } from "./loader";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({ redirect: (location: string) => ({ location }) }));
jest.mock("turboui", () => ({}));
jest.mock("@/api/socket", () => ({ setHeaders: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
const args = { params: { companyId: "company" } };
const billing = { account: { status: "active", cancelAtPeriodEnd: false } };

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
  window.appConfig = { billingEnabled: true } as typeof window.appConfig;
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get") ? { company: { permissions: { canManageBilling: true } } } : { billing },
  }));
});
afterEach(() => queryClient.clear());

it("loads a cancelable subscription and returns shared query inputs", async () => {
  expect(await loader(args)).toEqual({ queryInput: {} });
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it.each([
  { status: "free", cancelAtPeriodEnd: false },
  { status: "active", cancelAtPeriodEnd: true },
])("redirects an ineligible subscription: %o", async (account) => {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get")
      ? { company: { permissions: { canManageBilling: true } } }
      : { billing: { account } },
  }));
  await expect(loader(args)).rejects.toEqual({ location: "/company/admin/billing" });
});

it("uses fresh eligibility rather than an earlier cancelable snapshot", async () => {
  await loader(args);
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get")
      ? { company: { permissions: { canManageBilling: true } } }
      : { billing: { account: { status: "active", cancelAtPeriodEnd: true } } },
  }));
  await expect(loader(args)).rejects.toEqual({ location: "/company/admin/billing" });
});

it("redirects members without billing permission", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { company: { permissions: {} } } });
  await expect(loader(args)).rejects.toEqual({ location: "/company/admin" });
  expect(axios.get).toHaveBeenCalledTimes(1);
});
