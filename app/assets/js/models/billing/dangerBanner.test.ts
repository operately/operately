import * as Billing from "./index";

function accessState(overrides: Partial<Billing.BillingCompanyAccessState> = {}): Billing.BillingCompanyAccessState {
  return {
    accessState: "payment_grace",
    accessStateReason: "past_due",
    accessStateStartedAt: "2026-06-01T00:00:00Z",
    accessStateEndsAt: "2026-06-15T00:00:00Z",
    memberLimit: {
      code: "member_count_limit_exceeded",
      limitKey: "member_count",
      planKey: "team",
      currentUsage: 21,
      requestedDelta: 0,
      projectedUsage: 21,
      limit: 50,
      remaining: 29,
      nearLimit: false,
      blocked: false,
      enforced: true,
    },
    storageLimit: {
      code: "storage_limit_exceeded",
      limitKey: "storage_bytes",
      planKey: "team",
      currentUsage: 1,
      requestedDelta: 0,
      projectedUsage: 1,
      limit: 100,
      remaining: 99,
      nearLimit: false,
      blocked: false,
      enforced: true,
    },
    ...overrides,
  };
}

function warningStatus(overrides: Partial<Billing.BillingLimitStatus> = {}): Billing.BillingLimitStatus {
  return {
    code: "member_count_limit_exceeded",
    limitKey: "member_count",
    planKey: "free",
    currentUsage: 21,
    requestedDelta: 0,
    projectedUsage: 21,
    limit: 20,
    remaining: 0,
    nearLimit: true,
    blocked: true,
    enforced: true,
    recommendedUpgrade: {
      planKey: "team",
      billingInterval: "monthly",
      source: "next_plan",
    },
    ...overrides,
  };
}

function warnings(overrides: Partial<Billing.BillingLimitWarnings> = {}): Billing.BillingLimitWarnings {
  return {
    memberLimit: warningStatus(),
    storageLimit: warningStatus({
      code: "storage_limit_exceeded",
      limitKey: "storage_bytes",
      currentUsage: 950 * 1024 * 1024,
      projectedUsage: 950 * 1024 * 1024,
      limit: 1024 * 1024 * 1024,
      remaining: 74 * 1024 * 1024,
      nearLimit: true,
      blocked: false,
    }),
    ...overrides,
  };
}

describe("billing danger banner helpers", () => {
  it("builds a payment-grace banner with a CTA for billing managers", () => {
    const banner = Billing.buildBillingDangerBanner(accessState(), null, true, {
      companyBillingPath: () => "/acme/admin/billing",
      companyBillingPlansPath: () => "/acme/admin/billing/plans",
    });

    expect(banner).toEqual({
      kind: "payment_default",
      mode: "payment_grace",
      title: "Payment issue requires attention",
      deadline: "2026-06-15T00:00:00Z",
      shouldContactAdmin: false,
      cta: {
        label: "Review billing",
        to: "/acme/admin/billing",
      },
    });
  });

  it("builds a read-only payment banner without a CTA for non-managers", () => {
    const banner = Billing.buildBillingDangerBanner(
      accessState({
        accessState: "read_only",
        accessStateEndsAt: null,
      }),
      null,
      false,
      {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: () => "/acme/admin/billing/plans",
      },
    );

    expect(banner).toEqual({
      kind: "payment_default",
      mode: "read_only",
      title: "This company is read-only",
      deadline: null,
      shouldContactAdmin: true,
      cta: null,
    });
  });

  it("builds a member-visible blocked over-limit banner from access-state snapshots", () => {
    const banner = Billing.buildBillingDangerBanner(
      accessState({
        accessState: "normal",
        accessStateReason: null,
        memberLimit: {
          ...accessState().memberLimit,
          limit: 20,
          blocked: true,
          nearLimit: true,
        },
        storageLimit: {
          ...accessState().storageLimit,
          currentUsage: 950 * 1024 * 1024,
          projectedUsage: 950 * 1024 * 1024,
          limit: 1024 * 1024 * 1024,
          remaining: 74 * 1024 * 1024,
          nearLimit: true,
        },
      }),
      null,
      false,
      {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: () => "/acme/admin/billing/plans",
      },
    );

    expect(banner).toEqual({
      kind: "over_limit",
      mode: "over_limit",
      title: "This company is over its plan limits",
      blockedLimitKeys: ["member_count"],
      shouldContactAdmin: true,
      cta: null,
      usageRows: [
        { label: "Active members", value: "21 / 20", state: "blocked" },
        { label: "Storage used", value: "950 MB / 1 GB", state: "near_limit" },
      ],
    });
  });

  it("uses warning data to build a manager over-limit banner with a plan CTA", () => {
    const banner = Billing.buildBillingDangerBanner(
      accessState({
        accessState: "normal",
        accessStateReason: null,
      }),
      warnings({
        storageLimit: warningStatus({
          code: "storage_limit_exceeded",
          limitKey: "storage_bytes",
          currentUsage: 1100 * 1024 * 1024,
          projectedUsage: 1100 * 1024 * 1024,
          limit: 1024 * 1024 * 1024,
          remaining: 0,
          nearLimit: true,
          blocked: true,
        }),
      }),
      true,
      {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: (opts) => `/acme/admin/billing/plans?plan=${opts?.plan}&billing_period=${opts?.billingPeriod}`,
      },
    );

    expect(banner).toEqual({
      kind: "over_limit",
      mode: "over_limit",
      title: "This company is over its plan limits",
      blockedLimitKeys: ["member_count", "storage_bytes"],
      shouldContactAdmin: false,
      cta: {
        label: "Review plans",
        to: "/acme/admin/billing/plans?plan=team&billing_period=monthly",
      },
      usageRows: [
        { label: "Active members", value: "21 / 20", state: "blocked" },
        { label: "Storage used", value: "1.1 GB / 1 GB", state: "blocked" },
      ],
    });
  });

  it("returns null when there is no danger state", () => {
    expect(
      Billing.buildBillingDangerBanner(
        accessState({
          accessState: "normal",
          accessStateReason: null,
          memberLimit: {
            ...accessState().memberLimit,
            currentUsage: 10,
            projectedUsage: 10,
            limit: 20,
            remaining: 10,
            nearLimit: false,
            blocked: false,
          },
          storageLimit: {
            ...accessState().storageLimit,
            currentUsage: 100,
            projectedUsage: 100,
            limit: 1024,
            remaining: 924,
            nearLimit: false,
            blocked: false,
          },
        }),
        null,
        true,
        {
          companyBillingPath: () => "/acme/admin/billing",
          companyBillingPlansPath: () => "/acme/admin/billing/plans",
        },
      ),
    ).toBeNull();
  });

  it("recognizes payment recovery access states from account-like inputs", () => {
    expect(Billing.isPaymentRecoveryAccessState(accessState())).toBe(true);
    expect(Billing.isPaymentRecoveryAccessState(accessState({ accessState: "read_only", accessStateEndsAt: null }))).toBe(true);
    expect(Billing.isPaymentRecoveryAccessState(accessState({ accessState: "normal", accessStateReason: null }))).toBe(false);
  });
});
