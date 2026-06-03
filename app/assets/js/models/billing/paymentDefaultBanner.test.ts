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

describe("payment default banner helpers", () => {
  it("builds a payment-grace banner with a CTA for owners", () => {
    const banner = Billing.buildPaymentDefaultBanner(accessState(), true, {
      companyBillingPath: () => "/acme/admin/billing",
    });

    expect(banner).toEqual({
      mode: "payment_grace",
      title: "Payment issue requires attention",
      deadline: "2026-06-15T00:00:00Z",
      cta: {
        label: "Review billing",
        to: "/acme/admin/billing",
      },
    });
  });

  it("builds a read-only banner without a CTA for regular members", () => {
    const banner = Billing.buildPaymentDefaultBanner(
      accessState({
        accessState: "read_only",
        accessStateEndsAt: null,
      }),
      false,
      {
        companyBillingPath: () => "/acme/admin/billing",
      },
    );

    expect(banner).toEqual({
      mode: "read_only",
      title: "This company is read-only",
      deadline: null,
      cta: null,
    });
  });

  it("adds a CTA for company admins who can manage billing", () => {
    const banner = Billing.buildPaymentDefaultBanner(accessState(), true, {
      companyBillingPath: () => "/acme/admin/billing",
    });

    expect(banner).toEqual({
      mode: "payment_grace",
      title: "Payment issue requires attention",
      deadline: "2026-06-15T00:00:00Z",
      cta: {
        label: "Review billing",
        to: "/acme/admin/billing",
      },
    });
  });

  it("returns null outside past-due recovery states", () => {
    expect(
      Billing.buildPaymentDefaultBanner(
        accessState({
          accessState: "normal",
          accessStateReason: null,
        }),
        true,
        {
          companyBillingPath: () => "/acme/admin/billing",
        },
      ),
    ).toBeNull();

    expect(
      Billing.buildPaymentDefaultBanner(
        accessState({
          accessState: "over_limit_grace",
          accessStateReason: "over_limit_after_downgrade",
        }),
        true,
        {
          companyBillingPath: () => "/acme/admin/billing",
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
