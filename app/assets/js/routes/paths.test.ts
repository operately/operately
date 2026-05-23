import { Paths } from "./paths";

describe("Paths.companyBillingPath", () => {
  it("builds the company billing path without query params", () => {
    expect(new Paths({ companyId: "acme" }).companyBillingPath()).toBe("/acme/admin/billing");
  });

  it("builds the company billing path with billing intent params", () => {
    expect(
      new Paths({ companyId: "acme" }).companyBillingPath({
        plan: "team",
        billingPeriod: "yearly",
        checkoutId: "chk_123",
      }),
    ).toBe("/acme/admin/billing?plan=team&billing_period=yearly&checkout_id=chk_123");
  });
});
