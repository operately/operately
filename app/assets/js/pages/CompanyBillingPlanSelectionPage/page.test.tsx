import * as Billing from "@/models/billing";

import { buildCompanyBillingPlanSelectionMode } from "turboui";

function billingOverviewMock(params: Partial<Billing.BillingOverview> = {}): Billing.BillingOverview {
  const { account, ...rest } = params;

  return {
    account: {
      provider: "polar",
      planKey: null,
      billingInterval: null,
      status: "free",
      suggestedPlanKey: "team",
      suggestedBillingInterval: "yearly",
      suggestedPlanSource: "website",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      pendingPlanKey: null,
      pendingBillingInterval: null,
      pendingCheckoutStartedAt: null,
      scheduledPlanKey: null,
      scheduledBillingInterval: null,
      scheduledChangeEffectiveAt: null,
      lastSyncedAt: "2026-05-23T00:00:00Z",
      ...(account || {}),
    },
    plans: [
      { key: "free", displayName: "Free", memberLimit: 20, storageLimitBytes: 1_073_741_824 },
      { key: "team", displayName: "Team", memberLimit: 50, storageLimitBytes: 107_374_182_400 },
      { key: "business", displayName: "Business", memberLimit: 200, storageLimitBytes: 1_099_511_627_776 },
    ],
    catalogProducts: [
      {
        id: "team-monthly",
        provider: "polar",
        planFamily: "team",
        billingInterval: "monthly",
        polarProductId: "pol_team_monthly",
        polarProductName: "Team Monthly",
        priceAmount: 7900,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
      {
        id: "team-yearly",
        provider: "polar",
        planFamily: "team",
        billingInterval: "yearly",
        polarProductId: "pol_team_yearly",
        polarProductName: "Team Yearly",
        priceAmount: 79000,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
      {
        id: "business-monthly",
        provider: "polar",
        planFamily: "business",
        billingInterval: "monthly",
        polarProductId: "pol_business_monthly",
        polarProductName: "Business Monthly",
        priceAmount: 19900,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
      {
        id: "business-yearly",
        provider: "polar",
        planFamily: "business",
        billingInterval: "yearly",
        polarProductId: "pol_business_yearly",
        polarProductName: "Business Yearly",
        priceAmount: 199000,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
    ],
    memberCount: 18,
    stale: false,
    ...rest,
  } as Billing.BillingOverview;
}

describe("CompanyBillingPlanSelectionPage bridge helpers", () => {
  it("builds selection props from the catalog data", () => {
    const billing = billingOverviewMock();

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      selection: Billing.selectTarget(billing, Billing.parseBillingSearch("?plan=team&billing_period=yearly")),
      actionError: null,
      isStartingCheckout: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onContinueToCheckout: jest.fn(),
    });

    expect(selection.selectedInterval).toBe("yearly");
    expect(selection.cards.map((card) => card.title)).toEqual(["Team", "Business"]);
    expect(selection.cards[0]?.priceLabel).toBe("$66 / month");
    expect(selection.cards[0]?.detailLines).toContain("Billed yearly at $790");
    expect(selection.continueAction.label).toBe("Continue to checkout");
  });

  it("preselects the suggested plan when no target is provided", () => {
    const billing = billingOverviewMock({
      account: {
        suggestedPlanKey: "business",
        suggestedBillingInterval: "yearly",
      } as any,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      selection: { target: null, source: null, warning: null },
      actionError: null,
      isStartingCheckout: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onContinueToCheckout: jest.fn(),
    });

    expect(selection.selectedInterval).toBe("yearly");
    expect(selection.cards.find((card) => card.title === "Business")?.selected).toBe(true);
    expect(selection.continueAction.disabled).toBe(false);
  });
});
