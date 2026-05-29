import * as Billing from "./index";

function createStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] || null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function limitStatus(overrides: Partial<Billing.BillingLimitStatus> = {}): Billing.BillingLimitStatus {
  return {
    code: "member_count_limit_exceeded",
    limitKey: "member_count",
    planKey: "free",
    currentUsage: 18,
    requestedDelta: 0,
    projectedUsage: 18,
    limit: 20,
    remaining: 2,
    nearLimit: true,
    blocked: false,
    enforced: true,
    recommendedUpgrade: {
      planKey: "team",
      billingInterval: "monthly",
      source: "next_plan",
    },
    ...overrides,
  };
}

function limitWarnings(overrides: Partial<Billing.BillingLimitWarnings> = {}): Billing.BillingLimitWarnings {
  return {
    memberLimit: limitStatus(),
    storageLimit: limitStatus({
      code: "storage_limit_exceeded",
      limitKey: "storage_bytes",
      currentUsage: 950 * 1024 * 1024,
      projectedUsage: 950 * 1024 * 1024,
      limit: 1024 * 1024 * 1024,
      remaining: 74 * 1024 * 1024,
    }),
    ...overrides,
  };
}

describe("approaching limit banner helpers", () => {
  it("builds an owner banner with a direct billing CTA", () => {
    const banner = Billing.buildApproachingLimitBanner(limitWarnings(), "owner", {
      companyBillingPath: () => "/acme/admin/billing",
      companyBillingPlansPath: (opts) =>
        `/acme/admin/billing/plans?plan=${opts?.plan}&billing_period=${opts?.billingPeriod}`,
    });

    expect(banner).toMatchObject({
      mode: "approaching",
      title: "Approaching your plan limits",
      cta: {
        label: "Review plans",
        to: "/acme/admin/billing/plans?plan=team&billing_period=monthly",
      },
    });
    expect(banner?.usageRows).toEqual([
      { label: "Active members", value: "18 / 20", state: "near_limit" },
      { label: "Storage used", value: "950 MB / 1 GB", state: "near_limit" },
    ]);
  });

  it("builds a company-admin banner without a billing CTA", () => {
    const banner = Billing.buildApproachingLimitBanner(limitWarnings(), "company_admin", {
      companyBillingPath: () => "/acme/admin/billing",
      companyBillingPlansPath: () => "/acme/admin/billing/plans",
    });

    expect(banner).toMatchObject({
      mode: "approaching",
      title: "Approaching your plan limits",
      cta: null,
    });
  });

  it("never builds a banner for regular members", () => {
    expect(
      Billing.buildApproachingLimitBanner(limitWarnings(), "regular", {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: () => "/acme/admin/billing/plans",
      }),
    ).toBeNull();
  });

  it("shows the banner when only one limit is active", () => {
    const banner = Billing.buildApproachingLimitBanner(
      limitWarnings({
        storageLimit: limitStatus({
          code: "storage_limit_exceeded",
          limitKey: "storage_bytes",
          nearLimit: false,
        }),
      }),
      "owner",
      {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: () => "/acme/admin/billing/plans",
      },
    );

    expect(banner?.activeLimitKeys).toEqual(["member_count"]);
    expect(banner?.usageRows).toEqual([{ label: "Active members", value: "18 / 20", state: "near_limit" }]);
  });

  it("shows one banner when both limit warnings are active", () => {
    const banner = Billing.buildApproachingLimitBanner(limitWarnings(), "owner", {
      companyBillingPath: () => "/acme/admin/billing",
      companyBillingPlansPath: () => "/acme/admin/billing/plans",
    });

    expect(banner?.activeLimitKeys).toEqual(["member_count", "storage_bytes"]);
  });

  it("builds an urgent owner banner when a limit is already blocked", () => {
    const banner = Billing.buildApproachingLimitBanner(
      limitWarnings({
        memberLimit: limitStatus({
          currentUsage: 21,
          projectedUsage: 21,
          limit: 20,
          remaining: 0,
          nearLimit: true,
          blocked: true,
        }),
        storageLimit: limitStatus({
          code: "storage_limit_exceeded",
          limitKey: "storage_bytes",
          nearLimit: false,
        }),
      }),
      "owner",
      {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: (opts) =>
          `/acme/admin/billing/plans?plan=${opts?.plan}&billing_period=${opts?.billingPeriod}`,
      },
    );

    expect(banner).toMatchObject({
      mode: "over_limit",
      title: "This company is over its plan limits",
      cta: {
        label: "Review plans",
        to: "/acme/admin/billing/plans?plan=team&billing_period=monthly",
      },
    });
    expect(banner?.usageRows).toEqual([{ label: "Active members", value: "21 / 20", state: "blocked" }]);
  });

  it("builds an urgent company-admin banner without a billing CTA when storage is blocked", () => {
    const banner = Billing.buildApproachingLimitBanner(
      limitWarnings({
        storageLimit: limitStatus({
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
      "company_admin",
      {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: () => "/acme/admin/billing/plans",
      },
    );

    expect(banner).toMatchObject({
      mode: "over_limit",
      title: "This company is over its plan limits",
      cta: null,
    });
  });

  it("shows one urgent banner with blocked rows first and near-limit rows after them", () => {
    const banner = Billing.buildApproachingLimitBanner(
      limitWarnings({
        memberLimit: limitStatus({
          currentUsage: 21,
          projectedUsage: 21,
          limit: 20,
          remaining: 0,
          nearLimit: true,
          blocked: true,
        }),
      }),
      "owner",
      {
        companyBillingPath: () => "/acme/admin/billing",
        companyBillingPlansPath: () => "/acme/admin/billing/plans",
      },
    );

    expect(banner).toMatchObject({
      mode: "over_limit",
      activeLimitKeys: ["member_count", "storage_bytes"],
    });
    expect(banner?.usageRows).toEqual([
      { label: "Active members", value: "21 / 20", state: "blocked" },
      { label: "Storage used", value: "950 MB / 1 GB", state: "near_limit" },
    ]);
  });

  it("stores dismissals per company and active warning type", () => {
    const storage = createStorage();

    Billing.dismissApproachingLimitBanner("acme", ["member_count", "storage_bytes"], {
      now: 123_456,
      storage,
    });

    expect(storage.getItem("billing-limit-banner:acme:member_count")).toBe("123456");
    expect(storage.getItem("billing-limit-banner:acme:storage_bytes")).toBe("123456");
  });

  it("keeps the banner hidden during the cooldown and restores it after four days", () => {
    const warnings = limitWarnings();
    const now = 500_000;
    const storage = createStorage();

    Billing.dismissApproachingLimitBanner("acme", ["member_count", "storage_bytes"], {
      now,
      storage,
    });

    expect(Billing.isApproachingLimitBannerDismissed(warnings, "acme", { now, storage })).toBe(true);
    expect(
      Billing.isApproachingLimitBannerDismissed(warnings, "acme", {
        now: now + Billing.APPROACHING_LIMIT_BANNER_COOLDOWN_MS - 1,
        storage,
      }),
    ).toBe(true);
    expect(
      Billing.isApproachingLimitBannerDismissed(warnings, "acme", {
        now: now + Billing.APPROACHING_LIMIT_BANNER_COOLDOWN_MS + 1,
        storage,
      }),
    ).toBe(false);
  });

  it("does not hide the banner if any active warning type lacks a dismissal", () => {
    const storage = createStorage();

    Billing.dismissApproachingLimitBanner("acme", ["member_count"], {
      now: 999,
      storage,
    });

    expect(Billing.isApproachingLimitBannerDismissed(limitWarnings(), "acme", { now: 1_000, storage })).toBe(false);
  });

  it("recognizes billing management routes", () => {
    expect(Billing.isBillingManagementPath("/acme/admin/billing", "/acme/admin/billing")).toBe(true);
    expect(Billing.isBillingManagementPath("/acme/admin/billing/plans", "/acme/admin/billing")).toBe(true);
    expect(Billing.isBillingManagementPath("/acme/admin/billing/cancel", "/acme/admin/billing")).toBe(true);
    expect(Billing.isBillingManagementPath("/acme", "/acme/admin/billing")).toBe(false);
  });
});
