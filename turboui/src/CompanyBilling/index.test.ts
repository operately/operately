import {
  buildCompanyBillingCancellationFeedback,
  buildCompanyBillingChangeConsequence,
  buildCompanyBillingOverageDescription,
  buildCompanyBillingPlanChangeFeedback,
  buildCompanyBillingReactivationFeedback,
  findCompanyBillingPlanDefinition,
  formatCompanyBillingPlanLabel,
  formatCompanyBillingPriceFromMinorUnits,
  getCompanyBillingCurrentPlanDefinition,
  isCompanyBillingCheckoutReturnSuccessful,
  listCompanyBillingSellableTargets,
  parseCompanyBillingSearch,
  selectCompanyBillingTarget,
} from "./index";
import type { CompanyBillingPage as CompanyBillingPageTypes } from "../CompanyBillingPage/types";

function billingOverviewMock(
  params: Partial<CompanyBillingPageTypes.BillingOverview> = {},
): CompanyBillingPageTypes.BillingOverview {
  const { account, ...rest } = params;

  return {
    account: {
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
      accessState: "normal",
      accessStateReason: null,
      accessStateStartedAt: null,
      accessStateEndsAt: null,
      ...(account || {}),
    },
    plans: [
      { key: "free", displayName: "Free", memberLimit: 20, storageLimitBytes: 1_073_741_824 },
      { key: "team", displayName: "Team", memberLimit: 50, storageLimitBytes: 107_374_182_400 },
      { key: "business", displayName: "Business", memberLimit: 200, storageLimitBytes: 1_099_511_627_776 },
    ],
    catalogProducts: [
      {
        planFamily: "team",
        billingInterval: "monthly",
        polarProductName: "Team Monthly",
        priceAmount: 7900,
        priceCurrency: "usd",
        active: true,
      },
      {
        planFamily: "team",
        billingInterval: "yearly",
        polarProductName: "Team Yearly",
        priceAmount: 79000,
        priceCurrency: "usd",
        active: true,
      },
      {
        planFamily: "business",
        billingInterval: "monthly",
        polarProductName: "Business Monthly",
        priceAmount: 19900,
        priceCurrency: "usd",
        active: true,
      },
      {
        planFamily: "business",
        billingInterval: "yearly",
        polarProductName: "Business Yearly",
        priceAmount: 199000,
        priceCurrency: "usd",
        active: true,
      },
    ],
    memberCount: 18,
    storageUsageBytes: 81 * 1024 ** 3,
    stale: false,
    ...rest,
  };
}

describe("CompanyBilling shared helpers", () => {
  it("finds the free current plan when the account is free and plan key is absent", () => {
    const billing = billingOverviewMock();

    expect(getCompanyBillingCurrentPlanDefinition(billing)?.displayName).toBe("Free");
    expect(findCompanyBillingPlanDefinition(billing.plans, "team")?.displayName).toBe("Team");
  });

  it("finds a custom current plan from the plan definitions", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "starter_internal",
        billingInterval: null,
        status: "active",
      },
      plans: [
        ...billingOverviewMock().plans,
        { key: "starter_internal", displayName: "Starter Internal", memberLimit: 12, storageLimitBytes: 4_096 },
      ],
    });

    expect(getCompanyBillingCurrentPlanDefinition(billing)?.displayName).toBe("Starter Internal");
  });

  it("formats plan labels and price labels", () => {
    expect(formatCompanyBillingPlanLabel("team", "yearly")).toBe("Team Yearly");
    expect(formatCompanyBillingPriceFromMinorUnits(7900, "usd")).toBe("$79");
  });

  it("parses billing search params", () => {
    expect(parseCompanyBillingSearch("?plan=team&billing_period=yearly&checkout_id=chk_123")).toEqual({
      rawPlan: "team",
      rawBillingPeriod: "yearly",
      plan: "team",
      billingInterval: "yearly",
      checkoutId: "chk_123",
      hasSelectionIntent: true,
    });
  });

  it("keeps unsupported query plan keys raw while ignoring them for current selection", () => {
    expect(parseCompanyBillingSearch("?plan=enterprise&billing_period=yearly")).toEqual({
      rawPlan: "enterprise",
      rawBillingPeriod: "yearly",
      plan: null,
      billingInterval: "yearly",
      checkoutId: null,
      hasSelectionIntent: true,
    });
  });

  it("selects query, scheduled, current, and suggested targets predictably", () => {
    const queryBilling = billingOverviewMock({
      account: {
        pendingPlanKey: "team",
        pendingBillingInterval: "monthly",
        suggestedPlanKey: "business",
        suggestedBillingInterval: "yearly",
      },
    });

    expect(
      selectCompanyBillingTarget(queryBilling, parseCompanyBillingSearch("?plan=business&billing_period=yearly")),
    ).toMatchObject({
      source: "query",
      target: { plan: "business", billingInterval: "yearly" },
      warning: null,
    });

    const scheduledBilling = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        scheduledPlanKey: "business",
        scheduledBillingInterval: "yearly",
      },
    });

    expect(selectCompanyBillingTarget(scheduledBilling, parseCompanyBillingSearch(""))).toMatchObject({
      source: "scheduled",
      target: { plan: "business", billingInterval: "yearly" },
    });

    const currentBilling = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "past_due",
        suggestedPlanKey: null,
      },
    });

    expect(selectCompanyBillingTarget(currentBilling, parseCompanyBillingSearch(""))).toMatchObject({
      source: "current",
      target: { plan: "business", billingInterval: "monthly" },
    });

    expect(selectCompanyBillingTarget(billingOverviewMock(), parseCompanyBillingSearch(""))).toMatchObject({
      source: "suggested",
      target: { plan: "team", billingInterval: "yearly" },
    });
  });

  it("falls back to the first catalog target when the requested selection is unavailable", () => {
    const billing = billingOverviewMock({
      catalogProducts: billingOverviewMock().catalogProducts.filter((product) => product.planFamily !== "business"),
    });

    expect(
      selectCompanyBillingTarget(billing, parseCompanyBillingSearch("?plan=business&billing_period=yearly")),
    ).toMatchObject({
      source: "suggested",
      target: { plan: "team", billingInterval: "yearly" },
    });
  });

  it("lists sellable targets in a stable order", () => {
    expect(
      listCompanyBillingSellableTargets(billingOverviewMock()).map(
        (target) => `${target.plan}:${target.billingInterval}`,
      ),
    ).toEqual(["team:monthly", "team:yearly", "business:monthly", "business:yearly"]);
  });

  it("ignores unsupported catalog plans in the current self-serve selection flow", () => {
    const billing = billingOverviewMock({
      catalogProducts: [
        ...billingOverviewMock().catalogProducts,
        {
          planFamily: "enterprise",
          billingInterval: "monthly",
          polarProductName: "Enterprise Monthly",
          priceAmount: 49900,
          priceCurrency: "usd",
          active: true,
        },
      ],
    });

    expect(listCompanyBillingSellableTargets(billing).map((target) => target.plan)).toEqual([
      "team",
      "team",
      "business",
      "business",
    ]);
  });

  it("detects successful checkout returns once the paid plan is live", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "yearly",
        status: "active",
        pendingPlanKey: "team",
        pendingBillingInterval: "yearly",
      },
    });

    expect(
      isCompanyBillingCheckoutReturnSuccessful(billing, { plan: "team", billingInterval: "yearly", product: null }),
    ).toBe(true);
  });

  it("builds immediate and scheduled plan-change feedback", () => {
    const immediateFeedback = buildCompanyBillingPlanChangeFeedback(
      billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "monthly",
          status: "active",
        },
      }),
    );

    const scheduledFeedback = buildCompanyBillingPlanChangeFeedback(
      billingOverviewMock({
        account: {
          planKey: "team",
          billingInterval: "yearly",
          status: "active",
          scheduledPlanKey: "team",
          scheduledBillingInterval: "monthly",
          scheduledChangeEffectiveAt: "2026-06-14T00:00:00Z",
        },
      }),
    );

    expect(immediateFeedback).toMatchObject({ message: "Plan updated" });
    expect(immediateFeedback.description).toContain("Business Monthly");
    expect(scheduledFeedback).toMatchObject({ message: "Plan change scheduled" });
    expect(scheduledFeedback.description).toContain("Team Monthly");
  });

  it("builds cancellation and reactivation feedback", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-14T00:00:00Z",
      },
    });

    expect(buildCompanyBillingCancellationFeedback(billing)).toMatchObject({ message: "Cancellation scheduled" });
    expect(buildCompanyBillingReactivationFeedback(billing)).toMatchObject({ message: "Current plan kept" });
  });

  it("builds downgrade consequences with member and storage overages", () => {
    const consequence = buildCompanyBillingChangeConsequence({
      billing: billingOverviewMock({
        account: {
          planKey: "team",
          billingInterval: "monthly",
          status: "active",
        },
        memberCount: 25,
        storageUsageBytes: 2 * 1024 ** 3,
      }),
      targetPlanKey: "free",
      timing: "next_renewal",
      effectiveDate: "2026-06-14T00:00:00Z",
    });

    expect(consequence.memberLimit).toBe(20);
    expect(consequence.storageLimitBytes).toBe(1_073_741_824);
    expect(consequence.overageKind).toBe("member_and_storage");
    expect(buildCompanyBillingOverageDescription(consequence)).toContain(
      "adding or restoring people and uploading files may be blocked",
    );
  });
});
