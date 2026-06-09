import { hasSellableBillingIntent, parseBillingIntent, parseBillingInterval } from "./billingIntent";

const billingCatalog = {
  plans: [
    { key: "team", displayName: "Team", tierRank: 1, customerSelectable: true },
    { key: "enterprise", displayName: "Enterprise", tierRank: 2, customerSelectable: true },
    { key: "internal_trial", displayName: "Internal Trial", tierRank: 3, customerSelectable: false },
  ],
  catalogProducts: [
    { planFamily: "team", billingInterval: "monthly", active: true },
    { planFamily: "team", billingInterval: "yearly", active: true },
    { planFamily: "enterprise", billingInterval: "yearly", active: true },
  ],
} as any;

describe("NewCompanyPage billing intent parsing", () => {
  it("accepts dynamic sellable plans with matching active products", () => {
    expect(parseBillingIntent("?plan=team&billing_period=monthly", billingCatalog)).toEqual({
      plan: "team",
      billingPeriod: "monthly",
    });

    expect(parseBillingIntent("?plan=enterprise&billing_period=yearly", billingCatalog)).toEqual({
      plan: "enterprise",
      billingPeriod: "yearly",
    });
  });

  it("ignores unsupported plans, unavailable intervals, and incomplete pairs", () => {
    expect(parseBillingIntent("?plan=internal_trial&billing_period=yearly", billingCatalog)).toEqual({});
    expect(parseBillingIntent("?plan=enterprise&billing_period=monthly", billingCatalog)).toEqual({});
    expect(parseBillingIntent("?plan=unknown&billing_period=monthly", billingCatalog)).toEqual({});
    expect(parseBillingIntent("?plan=team", billingCatalog)).toEqual({});
    expect(parseBillingIntent("?billing_period=monthly", billingCatalog)).toEqual({});
  });

  it("checks sellability against selectable plans and active products", () => {
    expect(hasSellableBillingIntent(billingCatalog, "team", "monthly")).toBe(true);
    expect(hasSellableBillingIntent(billingCatalog, "enterprise", "monthly")).toBe(false);
    expect(hasSellableBillingIntent(billingCatalog, "internal_trial", "yearly")).toBe(false);
  });

  it("keeps the current billing interval parsing behavior", () => {
    expect(parseBillingInterval("monthly")).toBe("monthly");
    expect(parseBillingInterval("yearly")).toBe("yearly");
    expect(parseBillingInterval("weekly")).toBeUndefined();
    expect(parseBillingInterval(null)).toBeUndefined();
  });
});
