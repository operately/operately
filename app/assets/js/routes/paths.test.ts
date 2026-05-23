import { Paths } from "./paths";

describe("Paths.companyBillingPath", () => {
  it("builds the company billing path without query params", () => {
    expect(new Paths({ companyId: "acme" }).companyBillingPath()).toBe("/acme/admin/billing");
  });

  it("builds the company billing path with checkout return params", () => {
    expect(new Paths({ companyId: "acme" }).companyBillingPath({ checkoutId: "chk_123" })).toBe("/acme/admin/billing?checkout_id=chk_123");
  });
});

describe("Paths.companyBillingPlansPath", () => {
  it("builds the company billing plans path without query params", () => {
    expect(new Paths({ companyId: "acme" }).companyBillingPlansPath()).toBe("/acme/admin/billing/plans");
  });

  it("builds the company billing plans path with billing intent params", () => {
    expect(
      new Paths({ companyId: "acme" }).companyBillingPlansPath({
        plan: "team",
        billingPeriod: "yearly",
      }),
    ).toBe("/acme/admin/billing/plans?plan=team&billing_period=yearly");
  });
});
