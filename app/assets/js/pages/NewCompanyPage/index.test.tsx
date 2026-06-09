import { parseBillingInterval, parseCurrentSelfServeBillingPlan } from "./index";

describe("NewCompanyPage billing intent parsing", () => {
  it("accepts the current self-serve plan subset", () => {
    expect(parseCurrentSelfServeBillingPlan("team")).toBe("team");
    expect(parseCurrentSelfServeBillingPlan("business")).toBe("business");
    expect(parseCurrentSelfServeBillingPlan("unlimited")).toBe("unlimited");
  });

  it("ignores unsupported plan keys", () => {
    expect(parseCurrentSelfServeBillingPlan("enterprise")).toBeUndefined();
    expect(parseCurrentSelfServeBillingPlan("free")).toBeUndefined();
    expect(parseCurrentSelfServeBillingPlan(null)).toBeUndefined();
  });

  it("keeps the current billing interval parsing behavior", () => {
    expect(parseBillingInterval("monthly")).toBe("monthly");
    expect(parseBillingInterval("yearly")).toBe("yearly");
    expect(parseBillingInterval("weekly")).toBeUndefined();
    expect(parseBillingInterval(null)).toBeUndefined();
  });
});
