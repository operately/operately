import * as Billing from "./index";

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
});
