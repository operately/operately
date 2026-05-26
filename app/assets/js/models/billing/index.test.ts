import Api from "@/api";
import * as Billing from "./index";

function billingOverviewMock(params: Partial<Billing.BillingOverview> = {}): Billing.BillingOverview {
  const { account, ...rest } = params;

  return {
    account: {
      provider: "polar",
      planKey: null,
      billingInterval: null,
      status: "free",
      suggestedPlanKey: null,
      suggestedBillingInterval: null,
      suggestedPlanSource: null,
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
    memberCount: 10,
    stale: false,
    ...rest,
  } as Billing.BillingOverview;
}

function hostedSessionMock() {
  return {
    provider: "polar",
    url: "https://polar.sh/session",
    returnUrl: "https://app.example.com/acme/admin/billing",
    expiresAt: "2026-05-23T00:10:00Z",
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("billing model helpers", () => {
  it("returns the free plan definition when the account is free and plan_key is absent", () => {
    const plan = Billing.getCurrentPlanDefinition(billingOverviewMock());

    expect(plan?.displayName).toBe("Free");
    expect(plan?.memberLimit).toBe(20);
  });

  it("formats plan labels and safe plan fallbacks", () => {
    expect(Billing.formatPlanLabel("team", "yearly")).toBe("Team Yearly");
    expect(Billing.formatPlanName(null, "Unknown plan")).toBe("Unknown plan");
  });

  it("formats suggested plan sources", () => {
    expect(Billing.formatSuggestedPlanSource("website")).toBe("Selected on the website");
    expect(Billing.formatSuggestedPlanSource("member_count")).toBe("Member Count");
  });

  it("parses billing search params", () => {
    expect(Billing.parseBillingSearch("?plan=team&billing_period=yearly&checkout_id=chk_123")).toEqual({
      rawPlan: "team",
      rawBillingPeriod: "yearly",
      plan: "team",
      billingInterval: "yearly",
      checkoutId: "chk_123",
      hasSelectionIntent: true,
    });
  });

  it("selects the query target before any other fallback", () => {
    const billing = billingOverviewMock({
      account: {
        pendingPlanKey: "team",
        pendingBillingInterval: "monthly",
        suggestedPlanKey: "business",
        suggestedBillingInterval: "yearly",
      } as any,
    });

    const selection = Billing.selectTarget(billing, Billing.parseBillingSearch("?plan=business&billing_period=yearly"));

    expect(selection.source).toBe("query");
    expect(selection.warning).toBeNull();
    expect(selection.target).toMatchObject({ plan: "business", billingInterval: "yearly" });
  });

  it("falls back to the scheduled target for paid companies", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        scheduledPlanKey: "business",
        scheduledBillingInterval: "yearly",
      } as any,
    });

    const selection = Billing.selectTarget(billing, Billing.parseBillingSearch(""));

    expect(selection.source).toBe("scheduled");
    expect(selection.target).toMatchObject({ plan: "business", billingInterval: "yearly" });
  });

  it("falls back to the current target for paid companies without a scheduled change", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "past_due",
      } as any,
    });

    const selection = Billing.selectTarget(billing, Billing.parseBillingSearch(""));

    expect(selection.source).toBe("current");
    expect(selection.target).toMatchObject({ plan: "business", billingInterval: "monthly" });
  });

  it("falls back to the suggested target for free companies", () => {
    const billing = billingOverviewMock({
      account: {
        suggestedPlanKey: "business",
        suggestedBillingInterval: "yearly",
      } as any,
    });

    const selection = Billing.selectTarget(billing, Billing.parseBillingSearch(""));

    expect(selection.source).toBe("suggested");
    expect(selection.target).toMatchObject({ plan: "business", billingInterval: "yearly" });
  });

  it("falls back gracefully when the query target is invalid or unsellable", () => {
    const billing = billingOverviewMock({
      catalogProducts: billingOverviewMock().catalogProducts.filter((product) => product.planFamily !== "business"),
    });

    const selection = Billing.selectTarget(billing, Billing.parseBillingSearch("?plan=business&billing_period=yearly"));

    expect(selection.source).toBe("catalog");
    expect(selection.warning).toContain("not currently available");
    expect(selection.target).toMatchObject({ plan: "team", billingInterval: "monthly" });
  });

  it("resolves sellable products and sorts targets predictably", () => {
    const billing = billingOverviewMock();

    expect(Billing.findSellableProduct(billing.catalogProducts, "business", "yearly")?.polarProductId).toBe("pol_business_yearly");
    expect(Billing.listSellableTargets(billing).map((target) => `${target.plan}:${target.billingInterval}`)).toEqual([
      "team:monthly",
      "team:yearly",
      "business:monthly",
      "business:yearly",
    ]);
  });

  it("formats prices from minor units", () => {
    expect(Billing.formatPriceFromMinorUnits(7900, "usd")).toContain("79");
    expect(Billing.formatPriceFromMinorUnits(null, "usd")).toBe("Unavailable");
  });

  it("detects successful checkout returns once the paid plan is live", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "yearly",
        status: "active",
        pendingPlanKey: "team",
        pendingBillingInterval: "yearly",
      } as any,
    });

    expect(Billing.isCheckoutReturnSuccessful(billing, { plan: "team", billingInterval: "yearly", product: null })).toBe(true);
  });

  it("builds scheduled and immediate plan-change feedback", () => {
    const scheduledFeedback = Billing.buildPlanChangeFeedback(
      billingOverviewMock({
        account: {
          planKey: "team",
          billingInterval: "monthly",
          status: "active",
          scheduledPlanKey: "business",
          scheduledBillingInterval: "yearly",
          scheduledChangeEffectiveAt: "2026-06-14T00:00:00Z",
        } as any,
      }),
    );

    const immediateFeedback = Billing.buildPlanChangeFeedback(
      billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "monthly",
          status: "active",
        } as any,
      }),
    );

    expect(scheduledFeedback.message).toBe("Plan change scheduled");
    expect(scheduledFeedback.description).toContain("Business Yearly");
    expect(immediateFeedback.message).toBe("Plan updated");
    expect(immediateFeedback.description).toContain("Business Monthly");
  });

  it("builds cancellation summary and success feedback", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-14T00:00:00Z",
        cancelAtPeriodEnd: true,
      } as any,
      memberCount: 25,
    });

    const summary = Billing.buildCancellationSummary(billing);
    const feedback = Billing.buildCancellationFeedback(billing);

    expect(summary.freePlanMemberLimit).toBe(20);
    expect(summary.willExceedFreeMemberLimit).toBe(true);
    expect(summary.memberOverage).toBe(5);
    expect(feedback.message).toBe("Cancellation scheduled");
  });

  it("builds reactivation feedback", () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "yearly",
        status: "active",
        cancelAtPeriodEnd: false,
      } as any,
    });

    const feedback = Billing.buildReactivationFeedback(billing);

    expect(feedback.message).toBe("Plan reactivated");
    expect(feedback.description).toContain("Business Yearly");
  });

  it("changes the plan through the billing api", async () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
      } as any,
    });

    jest.spyOn(Api.billing, "changePlan").mockResolvedValue({ billing } as any);

    const result = await Billing.changePlan({ plan: "business", billingInterval: "monthly", product: billing.catalogProducts[2] });

    expect(Api.billing.changePlan).toHaveBeenCalledWith({ plan: "business", billingInterval: "monthly" });
    expect(result).toEqual({ outcome: "billing_updated", billing });
  });

  it("cancels and reactivates subscriptions through the billing api", async () => {
    const pendingCancelBilling = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        cancelAtPeriodEnd: true,
      } as any,
    });
    const reactivatedBilling = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        cancelAtPeriodEnd: false,
      } as any,
    });

    jest.spyOn(Api.billing, "cancel").mockResolvedValue({ billing: pendingCancelBilling } as any);
    jest.spyOn(Api.billing, "reactivate").mockResolvedValue({ billing: reactivatedBilling } as any);

    const cancelResult = await Billing.cancelSubscription();
    const reactivateResult = await Billing.reactivateSubscription();

    expect(Api.billing.cancel).toHaveBeenCalledWith({});
    expect(Api.billing.reactivate).toHaveBeenCalledWith({});
    expect(cancelResult).toEqual({ outcome: "billing_updated", billing: pendingCancelBilling });
    expect(reactivateResult).toEqual({ outcome: "billing_updated", billing: reactivatedBilling });
  });

  it("opens payment-method and portal sessions through the billing api", async () => {
    jest.spyOn(Api.billing, "createPaymentMethodSession").mockResolvedValue({ session: hostedSessionMock() } as any);
    jest.spyOn(Api.billing, "createCustomerPortalSession").mockResolvedValue({ session: hostedSessionMock() } as any);

    const paymentMethodResult = await Billing.beginPaymentMethodSession("/acme/admin/billing");
    const portalResult = await Billing.beginCustomerPortalSession("/acme/admin/billing");

    expect(Api.billing.createPaymentMethodSession).toHaveBeenCalledWith({ returnTo: "/acme/admin/billing" });
    expect(Api.billing.createCustomerPortalSession).toHaveBeenCalledWith({ returnTo: "/acme/admin/billing" });
    expect(paymentMethodResult).toEqual({ outcome: "session_created", session: hostedSessionMock() });
    expect(portalResult).toEqual({ outcome: "session_created", session: hostedSessionMock() });
  });
});
