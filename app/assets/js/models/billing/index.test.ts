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
    ],
    memberCount: 10,
    storageUsageBytes: 81 * 1024 ** 3,
    stale: false,
    ...rest,
  } as Billing.BillingOverview;
}

function accessStateMock(): Billing.BillingCompanyAccessState {
  const memberLimit = {
    code: "member_count_limit_status",
    limitKey: "member_count",
    planKey: "team" as const,
    currentUsage: 10,
    requestedDelta: 0,
    projectedUsage: 10,
    limit: 50,
    remaining: 40,
    nearLimit: false,
    blocked: false,
    enforced: true,
  };

  const storageLimit = {
    code: "storage_bytes_limit_status",
    limitKey: "storage_bytes",
    planKey: "team" as const,
    currentUsage: 81 * 1024 ** 3,
    requestedDelta: 0,
    projectedUsage: 81 * 1024 ** 3,
    limit: 107_374_182_400,
    remaining: 19 * 1024 ** 3,
    nearLimit: true,
    blocked: false,
    enforced: true,
  };

  return {
    accessState: "payment_grace",
    accessStateReason: "past_due",
    accessStateStartedAt: "2026-05-23T00:00:00Z",
    accessStateEndsAt: "2026-06-06T00:00:00Z",
    memberLimit,
    storageLimit,
  };
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
  it("captures external billing redirects in test mode instead of leaving the page", () => {
    const originalWindow = globalThis.window;
    const assign = jest.fn();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { assign },
        __tests: {
          billing: {
            captureExternalNavigation: true,
            externalNavigations: [],
          },
        },
      },
    });

    try {
      Billing.redirectToExternalBillingUrl("https://polar.sh/checkout/test");

      expect(assign).not.toHaveBeenCalled();
      expect(globalThis.window.__tests?.billing?.externalNavigations).toEqual(["https://polar.sh/checkout/test"]);
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      } else {
        delete (globalThis as { window?: Window }).window;
      }
    }
  });

  it("uses the browser location when billing redirect capture is disabled", () => {
    const originalWindow = globalThis.window;
    const assign = jest.fn();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { assign },
      },
    });

    try {
      Billing.redirectToExternalBillingUrl("https://polar.sh/checkout/test");
      expect(assign).toHaveBeenCalledWith("https://polar.sh/checkout/test");
    } finally {
      if (originalWindow) {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      } else {
        delete (globalThis as { window?: Window }).window;
      }
    }
  });

  it("loads billing overview, access state, and refresh data from the api", async () => {
    const billing = billingOverviewMock();
    const accessState = accessStateMock();

    jest.spyOn(Api.billing, "get").mockResolvedValue({ billing } as any);
    jest.spyOn(Api.billing, "getAccessState").mockResolvedValue({ accessState } as any);
    jest.spyOn(Api.billing, "refresh").mockResolvedValue({ billing } as any);

    await expect(Billing.getBilling({})).resolves.toEqual(billing);
    await expect(Billing.getAccessState({})).resolves.toEqual(accessState);
    await expect(Billing.refreshBilling({})).resolves.toEqual(billing);
  });

  it("extracts limit errors with a structured upgrade recommendation from api responses", () => {
    const error = {
      response: {
        data: {
          error: "Bad request",
          message:
            "This company has reached its member limit: 20 of 20 active members. Adding or restoring people is blocked until this company is back within its plan limits.",
          details: {
            code: "member_count_limit_exceeded",
            limit_key: "member_count",
            plan_key: "free",
            current_usage: 20,
            requested_delta: 1,
            projected_usage: 21,
            limit: 20,
            remaining: 0,
            near_limit: true,
            blocked: true,
            enforced: true,
            recommended_upgrade: {
              plan_key: "team",
              billing_interval: "yearly",
              source: "suggested",
            },
          },
        },
      },
    };

    expect(Billing.extractLimitError(error)).toMatchObject({
      code: "member_count_limit_exceeded",
      limitKey: "member_count",
      planKey: "free",
      currentUsage: 20,
      requestedDelta: 1,
      projectedUsage: 21,
      limit: 20,
      remaining: 0,
      nearLimit: true,
      blocked: true,
      enforced: true,
      recommendedUpgrade: {
        source: "suggested",
        target: { plan: "team", billingInterval: "yearly" },
      },
    });
  });

  it("preserves arbitrary dynamic plan recommendations for the billing selection page", () => {
    expect(
      Billing.extractLimitErrorDetails({
        code: "member_count_limit_exceeded",
        limit_key: "member_count",
        plan_key: "free",
        current_usage: 20,
        requested_delta: 1,
        projected_usage: 21,
        limit: 20,
        remaining: 0,
        near_limit: true,
        blocked: true,
        enforced: true,
        recommended_upgrade: {
          plan_key: "enterprise",
          billing_interval: "monthly",
          source: "next_plan",
        },
      }),
    ).toMatchObject({
      recommendedUpgrade: {
        source: "next_plan",
        target: {
          plan: "enterprise",
          billingInterval: "monthly",
        },
      },
    });
  });

  it("builds owner guidance with a direct billing CTA", () => {
    const error = Billing.extractLimitErrorDetails({
      code: "member_count_limit_exceeded",
      limit_key: "member_count",
      plan_key: "free",
      current_usage: 20,
      requested_delta: 1,
      projected_usage: 21,
      limit: 20,
      remaining: 0,
      near_limit: true,
      blocked: true,
      enforced: true,
      recommended_upgrade: {
        plan_key: "team",
        billing_interval: "monthly",
        source: "next_plan",
      },
    })!;

    expect(
      Billing.buildMemberLimitGuidance(error, "owner", {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: (opts) =>
          `/acme/admin/billing/plans?plan=${opts?.plan}&billing_period=${opts?.billingPeriod}`,
      }),
    ).toMatchObject({
      title: "This company has reached its member limit",
      description: "Review billing to change the plan and add or restore people.",
      usageSummary: "This company has 20 active members. The plan includes 20.",
      recommendedPlanLabel: "Team Monthly",
      cta: {
        label: "Review billing",
        to: "/acme/admin/billing/plans?plan=team&billing_period=monthly",
      },
    });
  });

  it("builds company-admin guidance with the same billing CTA as owners", () => {
    const error = Billing.extractLimitErrorDetails({
      code: "member_count_limit_exceeded",
      limit_key: "member_count",
      plan_key: "free",
      current_usage: 20,
      requested_delta: 1,
      projected_usage: 21,
      limit: 20,
      remaining: 0,
      near_limit: true,
      blocked: true,
      enforced: true,
      recommended_upgrade: {
        plan_key: "team",
        billing_interval: "monthly",
        source: "next_plan",
      },
    })!;

    expect(
      Billing.buildMemberLimitGuidance(error, "company_admin", {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: (opts) =>
          `/acme/admin/billing/plans?plan=${opts?.plan}&billing_period=${opts?.billingPeriod}`,
      }),
    ).toMatchObject({
      description: "Review billing to change the plan and add or restore people.",
      usageSummary: "This company has 20 active members. The plan includes 20.",
      recommendedPlanLabel: "Team Monthly",
      cta: {
        label: "Review billing",
        to: "/acme/admin/billing/plans?plan=team&billing_period=monthly",
      },
    });
  });

  it("builds regular-member guidance without any billing CTA", () => {
    const error = Billing.extractLimitErrorDetails({
      code: "member_count_limit_exceeded",
      limit_key: "member_count",
      plan_key: "free",
      current_usage: 20,
      requested_delta: 1,
      projected_usage: 21,
      limit: 20,
      remaining: 0,
      near_limit: true,
      blocked: true,
      enforced: true,
      recommended_upgrade: null,
    })!;

    expect(
      Billing.buildMemberLimitGuidance(error, "regular", {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: () => "/acme/admin/billing/plans",
      }),
    ).toMatchObject({
      description: "Contact an admin or owner to review billing and change the plan before trying again.",
      usageSummary: "This company has 20 active members. The plan includes 20.",
      cta: null,
    });
  });

  it("starts checkout through the billing api", async () => {
    const session = {
      provider: "polar",
      url: "https://polar.sh/checkout/test",
      expiresAt: "2026-05-23T00:10:00Z",
      returnUrl: "https://app.example.com/acme/admin/billing",
    };

    jest.spyOn(Api.billing, "createCheckoutSession").mockResolvedValue({ session } as any);

    const result = await Billing.beginCheckout({
      plan: "team",
      billingInterval: "monthly",
      product: billingOverviewMock().catalogProducts[0],
    });

    expect(Api.billing.createCheckoutSession).toHaveBeenCalledWith({
      plan: "team",
      billingInterval: "monthly",
    });
    expect(result).toEqual({ outcome: "session_created", session });
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

    const result = await Billing.changePlan({
      plan: "business",
      billingInterval: "monthly",
      product: billing.catalogProducts[2],
    });

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
