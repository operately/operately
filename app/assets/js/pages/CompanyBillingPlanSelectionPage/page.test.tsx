import * as Billing from "@/models/billing";

import { parseCompanyBillingSearch, selectCompanyBillingTarget } from "turboui/CompanyBilling";
import {
  buildCompanyBillingPlanSelectionMode,
  buildCompanyBillingPlanSelectionPageViewModel,
} from "turboui/CompanyBillingPlanSelectionPage";

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
      {
        key: "free",
        displayName: "Free",
        tierRank: 0,
        customerSelectable: false,
        memberLimit: 20,
        storageLimitBytes: 1_073_741_824,
      },
      {
        key: "team",
        displayName: "Team",
        tierRank: 1,
        customerSelectable: true,
        memberLimit: 50,
        storageLimitBytes: 107_374_182_400,
      },
      {
        key: "business",
        displayName: "Business",
        tierRank: 2,
        customerSelectable: true,
        memberLimit: 200,
        storageLimitBytes: 1_099_511_627_776,
      },
      {
        key: "unlimited",
        displayName: "Unlimited",
        tierRank: 3,
        customerSelectable: true,
        memberLimit: null,
        storageLimitBytes: null,
      },
    ],
    catalogProducts: [
      {
        id: "team-monthly",
        provider: "polar",
        planFamily: "team",
        billingInterval: "monthly",
        polarProductId: "pol_pro_monthly",
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
        polarProductId: "pol_pro_yearly",
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
      {
        id: "unlimited-yearly",
        provider: "polar",
        planFamily: "unlimited",
        billingInterval: "yearly",
        polarProductId: "pol_unlimited_yearly",
        polarProductName: "Unlimited Yearly",
        priceAmount: 499000,
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
    storageUsageBytes: 81 * 1024 ** 3,
    stale: false,
    ...rest,
  } as Billing.BillingOverview;
}

describe("CompanyBillingPlanSelectionPage bridge helpers", () => {
  it("uses the refreshed checkout subtitle", () => {
    const viewModel = buildCompanyBillingPlanSelectionPageViewModel({
      title: ["Acme", "Choose a plan"],
      navigation: [],
      billing: billingOverviewMock(),
      selection: selectCompanyBillingTarget(billingOverviewMock(), parseCompanyBillingSearch("")),
      limitsEnforced: true,
      testId: "company-billing-plan-selection-page",
    });

    expect(viewModel.pageSubtitle).toBe(
      "Choose a paid plan for this company. Payment details are handled at checkout.",
    );
  });

  it("builds checkout mode props from the catalog data", () => {
    const billing = billingOverviewMock();

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=yearly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.mode).toBe("checkout");
    expect(selection.selectedInterval).toBe("yearly");
    expect(selection.cards.map((card) => card.title)).toEqual(["Team", "Business", "Unlimited"]);
    expect(selection.cards[0]?.priceLabel).toBe("$66 / month");
    expect(selection.cards[0]?.detailLines).toContain("100 GB storage");
    expect(selection.cards[0]?.detailLines).toContain("Billed yearly at $790");
    expect(selection.continueAction.label).toBe("Continue to checkout");
    expect(selection.continueAction.disabled).toBe(false);
  });

  it("renders dynamic sellable plan cards in tier-rank order", () => {
    const billing = billingOverviewMock({
      plans: [
        ...billingOverviewMock().plans,
        {
          __typename: "billing_plan_definition",
          key: "enterprise",
          displayName: "Enterprise",
          tierRank: 4,
          customerSelectable: true,
          memberLimit: 500,
          storageLimitBytes: 5_497_558_138_880,
        },
      ],
      catalogProducts: [
        ...billingOverviewMock().catalogProducts,
        {
          __typename: "billing_catalog_product",
          id: "enterprise-monthly",
          provider: "polar",
          planFamily: "enterprise",
          billingInterval: "monthly",
          polarProductId: "pol_enterprise_monthly",
          polarProductName: "Enterprise Monthly",
          priceAmount: 49900,
          priceCurrency: "usd",
          version: 1,
          active: true,
          archivedAt: null,
          lastSyncedAt: "2026-05-23T00:00:00Z",
          insertedAt: "2026-05-23T00:00:00Z",
          updatedAt: "2026-05-23T00:00:00Z",
        },
      ],
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(
        billing,
        parseCompanyBillingSearch("?plan=enterprise&billing_period=monthly"),
      ),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.cards.map((card) => card.title)).toEqual(["Team", "Business", "Unlimited", "Enterprise"]);
    expect(selection.cards.find((card) => card.title === "Enterprise")?.selected).toBe(true);
  });

  it("preselects the current paid plan and disables same-plan changes", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
        suggestedPlanKey: null,
        suggestedBillingInterval: null,
      } as any,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.mode).toBe("change_plan");
    expect(selection.selectedInterval).toBe("monthly");
    expect(selection.cards.find((card) => card.title === "Business")?.selected).toBe(true);
    expect(selection.continueAction.label).toBe("Change plan");
    expect(selection.continueAction.disabled).toBe(true);
    expect(selection.consequenceNotice).toBeNull();
  });

  it("preselects the scheduled target for paid companies", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        scheduledPlanKey: "business",
        scheduledBillingInterval: "yearly",
      } as any,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.mode).toBe("change_plan");
    expect(selection.selectedInterval).toBe("yearly");
    expect(selection.cards.find((card) => card.title === "Business")?.selected).toBe(true);
    expect(selection.continueAction.disabled).toBe(true);
    expect(selection.consequenceNotice?.message).toBe("Business Yearly takes effect immediately.");
  });

  it("preselects the suggested plan when no free-company target is provided", () => {
    const billing = billingOverviewMock({
      account: {
        suggestedPlanKey: "business",
        suggestedBillingInterval: "yearly",
      } as any,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: { target: null, source: null, warning: null },
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.selectedInterval).toBe("yearly");
    expect(selection.cards.find((card) => card.title === "Business")?.selected).toBe(true);
    expect(selection.continueAction.disabled).toBe(false);
    expect(selection.consequenceNotice).toBeNull();
  });

  it("shows an immediate preview for monthly-to-yearly changes on the same plan", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
      } as any,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=yearly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.mode).toBe("change_plan");
    expect(selection.consequenceNotice).toMatchObject({
      tone: "info",
      message: "Team Yearly takes effect immediately.",
      description: "",
      rows: [],
    });
    expect(selection.continueAction.disabled).toBe(false);
  });

  it("shows a scheduled preview for yearly-to-monthly changes on the same plan", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "yearly",
        status: "active",
        currentPeriodEnd: "2026-06-14T00:00:00Z",
      } as any,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=monthly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.mode).toBe("change_plan");
    expect(selection.consequenceNotice?.tone).toBe("info");
    expect(selection.consequenceNotice?.message).toContain("Team Monthly takes effect at the next renewal");
    expect(selection.consequenceNotice?.description).toBe("");
    expect(selection.consequenceNotice?.rows).toEqual([]);
  });

  it("shows downgrade details when the target plan still fits current usage", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-14T00:00:00Z",
      } as any,
      memberCount: 40,
      storageUsageBytes: 80 * 1024 ** 3,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=monthly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.consequenceNotice).toMatchObject({
      tone: "info",
      description: "",
      rows: [],
    });
    expect(selection.consequenceNotice?.message).toContain("Team Monthly takes effect at the next renewal");
  });

  it("shows downgrade warnings for member overage only", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
      } as any,
      memberCount: 60,
      storageUsageBytes: 80 * 1024 ** 3,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=monthly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.consequenceNotice?.tone).toBe("warning");
    expect(selection.consequenceNotice?.description).toContain("adding or restoring people may be blocked");
  });

  it("shows downgrade warnings for storage overage only", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
      } as any,
      memberCount: 40,
      storageUsageBytes: 120 * 1024 ** 3,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=monthly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.consequenceNotice?.tone).toBe("warning");
    expect(selection.consequenceNotice?.description).toContain("uploading files may be blocked");
    expect(selection.consequenceNotice?.description).toContain("120 GB");
    expect(selection.consequenceNotice?.description).toContain("100 GB");
  });

  it("shows downgrade warnings for combined member and storage overage", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
      } as any,
      memberCount: 60,
      storageUsageBytes: 120 * 1024 ** 3,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: true,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=monthly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.consequenceNotice?.tone).toBe("warning");
    expect(selection.consequenceNotice?.description).toContain(
      "adding or restoring people and uploading files may be blocked",
    );
    expect(selection.consequenceNotice?.description).toContain("60 active members");
    expect(selection.consequenceNotice?.description).toContain("120 GB");
  });

  it("keeps downgrade timing but suppresses overage warnings when limits are not enforced", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
      } as any,
      memberCount: 60,
      storageUsageBytes: 120 * 1024 ** 3,
    });

    const selection = buildCompanyBillingPlanSelectionMode({
      billing,
      limitsEnforced: false,
      selection: selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=team&billing_period=monthly")),
      actionError: null,
      isSubmitting: false,
      onSelectPlan: jest.fn(),
      onSelectInterval: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(selection.consequenceNotice).toMatchObject({
      tone: "info",
      description: "",
      rows: [],
    });
    expect(selection.consequenceNotice?.message).toContain("takes effect at the next renewal");
  });
});
