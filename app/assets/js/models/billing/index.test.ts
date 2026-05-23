import * as Billing from "./index";

function billingOverviewMock(params: Partial<Billing.BillingOverview> = {}): Billing.BillingOverview {
  return {
    account: {
      provider: "polar",
      planKey: "team",
      billingInterval: "monthly",
      status: "active",
      cancelAtPeriodEnd: false,
      ...(params.account || {}),
    },
    plans: [
      { key: "free", displayName: "Free", memberLimit: 20, storageLimitBytes: 1_073_741_824 },
      { key: "team", displayName: "Team", memberLimit: 50, storageLimitBytes: 107_374_182_400 },
    ],
    catalogProducts: [],
    memberCount: 10,
    stale: false,
    ...params,
  } as Billing.BillingOverview;
}

describe("billing model helpers", () => {
  it("returns the free plan definition when the account is free and plan_key is absent", () => {
    const plan = Billing.getCurrentPlanDefinition(
      billingOverviewMock({
        account: {
          planKey: null,
          billingInterval: null,
          status: "free",
        } as any,
      }),
    );

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
});
