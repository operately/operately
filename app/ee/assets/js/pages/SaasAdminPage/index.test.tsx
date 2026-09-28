/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as AdminApi from "@/ee/admin_api";
import { act, waitFor } from "@/__tests__/renderHook";
import { Page } from "./index";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/components/Pages", () => ({ Page: ({ children }: React.PropsWithChildren) => children }));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }: React.PropsWithChildren) => children,
  Body: ({ children }: React.PropsWithChildren) => children,
  Header: () => null,
}));
jest.mock("@/components/PaperContainer/PageOptions", () => ({ Root: () => null, Link: () => null }));
jest.mock("turboui", () => {
  const React = jest.requireActual("react");
  return {
    ...Object.fromEntries(
      [
        "AvatarList",
        "FormattedTime",
        "IconBuilding",
        "IconBuildingCommunity",
        "IconInfoCircle",
        "IconMail",
        "IconSearch",
        "IconShieldLock",
        "IconSparkles",
        "IconUser",
        "IconX",
        "IconTrash",
      ].map((name) => [name, () => null]),
    ),
    Tooltip: ({ children }: React.PropsWithChildren) => children,
    DivLink: ({ children, to }: React.PropsWithChildren<{ to: string }>) => <a href={to}>{children}</a>,
    formatStorageBytes: () => "0 B",
    useTabs: (initial: string) => {
      const [active, setActive] = React.useState(initial);
      return { active, setActive };
    },
    Tabs: ({ tabs }: { tabs: { setActive: (tab: string) => void } }) => (
      <div>
        {["active", "all", "accounts"].map((tab) => (
          <button key={tab} data-test-id={`tab-${tab}`} onClick={() => tabs.setActive(tab)}>
            {tab}
          </button>
        ))}
      </div>
    ),
    Menu: ({ children }: React.PropsWithChildren) => children,
    MenuActionItem: ({
      children,
      onClick,
      testId,
    }: React.PropsWithChildren<{ onClick: () => void; testId: string }>) => (
      <button data-test-id={testId} onClick={onClick}>
        {children}
      </button>
    ),
    ConfirmDialog: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) =>
      isOpen ? (
        <button data-test-id="confirm" onClick={onConfirm}>
          Confirm
        </button>
      ) : null,
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
  };
});

let client: QueryClient;
let root: Root;
let container: HTMLDivElement;
let accounts: AdminApi.Account[];
const companies = [
  { id: "alpha", name: "Alpha" },
  { id: "beta", name: "Beta" },
];

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  AdminApi.default.default.setBasePath("/admin/api");
  window.appConfig = { account: { id: 123 } } as typeof window.appConfig;
  accounts = [
    {
      id: "alice",
      fullName: "Alice",
      email: "alice@example.com",
      siteAdmin: false,
      companiesCount: 1,
      ownedCompaniesCount: 0,
      insertedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "bob",
      fullName: "Bob",
      email: "bob@example.com",
      siteAdmin: true,
      companiesCount: 0,
      ownedCompaniesCount: 0,
      insertedAt: "2026-01-01T00:00:00Z",
    },
  ];
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_accounts")
      ? { accounts }
      : { companies: url.endsWith("get_active_companies") ? companies.slice(0, 1) : companies },
  }));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  client.clear();
});

function mount() {
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>,
    ),
  );
}

function control(id: string) {
  return container.querySelector<HTMLElement>(`[data-test-id="${id}"]`);
}

function click(id: string) {
  const element = control(id);
  if (!element) throw new Error(`Missing control: ${id}`);
  act(() => element.click());
}

function search(value: string) {
  const input = container.querySelector("input");
  if (!input) throw new Error("Missing search input");
  act(() => {
    input.value = value;
    Simulate.change(input);
  });
}

function companyLinks() {
  return Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href"));
}

it("shows all three lists and preserves each tab's debounced filter", async () => {
  mount();
  await waitFor(() => expect(companyLinks()).toEqual(["/admin/companies/alpha"]));
  search("missing");
  await waitFor(() => expect(companyLinks()).toEqual([]));
  click("tab-all");
  await waitFor(() => expect(companyLinks()).toHaveLength(2));
  search(" BETA ");
  await waitFor(() => expect(companyLinks()).toEqual(["/admin/companies/beta"]));
  click("tab-accounts");
  await waitFor(() => expect(control("promote-account-alice")).not.toBeNull());
  search(" BOB@EXAMPLE.COM ");
  await waitFor(() => expect(control("promote-account-alice")).toBeNull());
  expect(control("demote-account-bob")).not.toBeNull();
  click("tab-all");
  expect(container.querySelector("input")?.value).toBe(" BETA ");
  await waitFor(() => expect(companyLinks()).toEqual(["/admin/companies/beta"]));
  click("tab-active");
  expect(container.querySelector("input")?.value).toBe("missing");
  expect(companyLinks()).toEqual([]);
});

it.each(["promote", "demote", "delete"])(
  "updates the account row after %s and returning to the tab",
  async (action) => {
    const id = action === "demote" ? "bob" : "alice";
    jest.mocked(axios.post).mockImplementation(async () => {
      accounts =
        action === "delete"
          ? accounts.filter((account) => account.id !== id)
          : accounts.map((account) => (account.id === id ? { ...account, siteAdmin: action === "promote" } : account));
      return { data: { success: true } };
    });
    mount();
    click("tab-accounts");
    await waitFor(() => expect(control(`${action}-account-${id}`)).not.toBeNull());
    click(`${action}-account-${id}`);
    click("confirm");
    await waitFor(() => expect(control("confirm")).toBeNull());
    expect(control(`${action}-account-${id}`)).toBeNull();
    click("tab-all");
    click("tab-accounts");
    expect(control(`${action}-account-${id}`)).toBeNull();
    if (action !== "delete")
      expect(control(`${action === "promote" ? "demote" : "promote"}-account-${id}`)).not.toBeNull();
    await waitFor(() => expect(client.isFetching()).toBe(0));
  },
);

it.each(["active", "all", "accounts"])("renders request errors for the %s tab", async (tab) => {
  jest.mocked(axios.get).mockRejectedValue(new Error("Forbidden"));
  mount();
  if (tab !== "active") click(`tab-${tab}`);
  expect(control(`saas-admin-${tab}-error`)).toBeNull();
  await waitFor(() => expect(control(`saas-admin-${tab}-error`)).not.toBeNull());
  expect(companyLinks()).toEqual([]);
  expect(control("promote-account-alice")).toBeNull();
});
