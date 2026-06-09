import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Page,
  archiveBillingPlanDefinition,
  archiveBillingCatalogProduct,
  setActiveBillingCatalogProduct,
  syncBillingCatalogProducts,
  unarchiveBillingPlanDefinition,
} from "./index";

let mockActiveTab = "products";
let mockRefresh = jest.fn();
let mockLoadedData = {
  products: [
    {
      id: "prod_team_monthly",
      provider: "polar",
      planFamily: "team",
      billingInterval: "monthly",
      polarProductId: "polar_team_monthly",
      polarProductName: "Team Monthly",
      priceAmount: 2900,
      priceCurrency: "usd",
      version: 1,
      active: true,
      archivedAt: null,
      lastSyncedAt: "2026-06-08T00:00:00Z",
      insertedAt: "2026-06-08T00:00:00Z",
      updatedAt: "2026-06-08T00:00:00Z",
    },
  ],
  planDefinitions: [
    {
      id: "plan_free",
      key: "free",
      displayName: "Free",
      tierRank: 0,
      billingBehavior: "internal",
      customerSelectable: false,
      archivedAt: null,
      memberLimit: 20,
      storageLimitBytes: 1_073_741_824,
    },
    {
      id: "plan_team",
      key: "team",
      displayName: "Team",
      tierRank: 1,
      billingBehavior: "provider_managed",
      customerSelectable: true,
      archivedAt: null,
      memberLimit: 50,
      storageLimitBytes: 107_374_182_400,
    },
    {
      id: "plan_business",
      key: "business",
      displayName: "Business",
      tierRank: 2,
      billingBehavior: "provider_managed",
      customerSelectable: true,
      archivedAt: null,
      memberLimit: 200,
      storageLimitBytes: 1_099_511_627_776,
    },
    {
      id: "plan_legacy",
      key: "legacy_enterprise",
      displayName: "Legacy Enterprise",
      tierRank: 4,
      billingBehavior: "provider_managed",
      customerSelectable: false,
      archivedAt: "2026-06-08T00:00:00Z",
      memberLimit: null,
      storageLimitBytes: null,
    },
  ],
};

jest.mock("@/components/Pages", () => ({
  Page: ({ children, testId }: { children: React.ReactNode; testId?: string }) => (
    <div data-test-id={testId}>{children}</div>
  ),
  useLoadedData: jest.fn(() => mockLoadedData),
  useRefresh: jest.fn(() => mockRefresh),
}));

jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Header: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

jest.mock("./PlanDefinitionModal", () => ({
  PlanDefinitionModal: () => <div>plan-definition-modal</div>,
}));

jest.mock("./ProductModal", () => ({
  ProductModal: () => <div>product-modal</div>,
}));

jest.mock("turboui", () => {
  const { formatStorageBytes } = jest.requireActual("turboui/CompanyBilling");

  return {
    ConfirmDialog: ({ isOpen, title, message, confirmText }: any) =>
      isOpen ? (
        <div>
          {title}
          {message}
          {confirmText}
        </div>
      ) : null,
    formatStorageBytes,
    IconBuilding: () => null,
    IconCheck: () => null,
    IconCircleCheckFilled: () => null,
    IconCircleXFilled: () => null,
    IconEdit: () => null,
    IconPlus: () => null,
    IconRefresh: () => null,
    IconSettings: () => null,
    IconTrash: () => null,
    Menu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    MenuActionItem: ({ children, hidden }: { children: React.ReactNode; hidden?: boolean }) =>
      hidden ? null : <button>{children}</button>,
    Tabs: ({ tabs }: { tabs: { active: string } }) => <div>Active tab: {tabs.active}</div>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useTabs: (_defaultTab: string, tabs: { id: string; label: string }[]) => ({ active: mockActiveTab, tabs }),
  };
});

describe("SaasAdminBillingCatalogPage", () => {
  beforeEach(() => {
    mockActiveTab = "products";
    mockRefresh = jest.fn();
    mockLoadedData = {
      ...mockLoadedData,
      products: [...mockLoadedData.products],
      planDefinitions: [...mockLoadedData.planDefinitions],
    };
  });

  it("shows the default Products tab with product-only header actions", () => {
    const markup = renderToStaticMarkup(<Page />);

    expect(markup).toContain("Active tab: products");
    expect(markup).toContain("Create product");
    expect(markup).toContain("Sync from Polar");
    expect(markup).toContain("Team Monthly");
    expect(markup).toContain("Plan Family");
    expect(markup).not.toContain("Sort order");
    expect(markup).not.toContain("Storage limit");
  });

  it("renders the Plans tab with seeded rows, keys, and human-friendly storage limits", () => {
    mockActiveTab = "plans";

    const markup = renderToStaticMarkup(<Page />);

    expect(markup).toContain("Active tab: plans");
    expect(markup).toContain("Create plan");
    expect(markup).not.toContain("Create product");
    expect(markup).not.toContain("Sync from Polar");
    expect(markup).toContain("Key");
    expect(markup).toContain("Status");
    expect(markup).toContain("Behavior");
    expect(markup).toContain("Selectable");
    expect(markup).toContain("Tier rank");
    expect(markup).toContain("free");
    expect(markup).toContain("team");
    expect(markup).toContain("business");
    expect(markup).toContain("legacy_enterprise");
    expect(markup).toContain("Internal");
    expect(markup).toContain("Provider managed");
    expect(markup).toContain("Archived");
    expect(markup).toContain("Unarchive");
    expect(markup).toContain("1 GB");
    expect(markup).toContain("100 GB");
    expect(markup).toContain("1 TB");
    expect(markup).toContain("Unlimited");
    expect(markup).not.toContain("Unavailable");

    expect(markup.indexOf("Free")).toBeLessThan(markup.indexOf("Team"));
    expect(markup.indexOf("Team")).toBeLessThan(markup.indexOf("Business"));
    expect(markup.indexOf("Business")).toBeLessThan(markup.indexOf("Legacy Enterprise"));
  });
});

describe("SaasAdminBillingCatalogPage refresh helpers", () => {
  beforeEach(() => {
    mockRefresh = jest.fn();
  });

  it("revalidates after syncing products", async () => {
    const mockSync = jest.fn().mockResolvedValue({});

    await syncBillingCatalogProducts(mockSync, mockRefresh);

    expect(mockSync).toHaveBeenCalledWith({});
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("revalidates after archiving a product", async () => {
    const mockArchive = jest.fn().mockResolvedValue({});
    const mockOnArchived = jest.fn();

    await archiveBillingCatalogProduct(mockArchive, "prod_team_monthly", mockRefresh, mockOnArchived);

    expect(mockArchive).toHaveBeenCalledWith({ id: "prod_team_monthly" });
    expect(mockOnArchived).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("revalidates after setting a product active", async () => {
    const mockSetActive = jest.fn().mockResolvedValue({});

    await setActiveBillingCatalogProduct(mockSetActive, "prod_team_monthly", mockRefresh);

    expect(mockSetActive).toHaveBeenCalledWith({ id: "prod_team_monthly" });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("revalidates after archiving a plan", async () => {
    const mockArchive = jest.fn().mockResolvedValue({});
    const mockOnArchived = jest.fn();

    await archiveBillingPlanDefinition(mockArchive, "plan_team", mockRefresh, mockOnArchived);

    expect(mockArchive).toHaveBeenCalledWith({ id: "plan_team" });
    expect(mockOnArchived).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("revalidates after unarchiving a plan", async () => {
    const mockUnarchive = jest.fn().mockResolvedValue({});

    await unarchiveBillingPlanDefinition(mockUnarchive, "plan_legacy", mockRefresh);

    expect(mockUnarchive).toHaveBeenCalledWith({ id: "plan_legacy" });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
