import * as Billing from "@/models/billing";

import { buildCompanyBillingCancellationPageViewModel } from "turboui";

function billingOverviewMock(params: Partial<Billing.BillingOverview> = {}): Billing.BillingOverview {
  const { account, ...rest } = params;

  return {
    account: {
      provider: "polar",
      planKey: "team",
      billingInterval: "monthly",
      status: "active",
      suggestedPlanKey: null,
      suggestedBillingInterval: null,
      suggestedPlanSource: null,
      currentPeriodEnd: "2026-06-14T00:00:00Z",
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
      { key: "free", displayName: "Free", memberLimit: 20, storageLimitBytes: 1_073_741_824 },
      { key: "team", displayName: "Team", memberLimit: 50, storageLimitBytes: 107_374_182_400 },
      { key: "business", displayName: "Business", memberLimit: 200, storageLimitBytes: 1_099_511_627_776 },
    ],
    catalogProducts: [],
    memberCount: 18,
    stale: false,
    ...rest,
  } as Billing.BillingOverview;
}

describe("CompanyBillingCancellationPage bridge helpers", () => {
  it("derives cancellation summary details from billing overview data", () => {
    const summary = Billing.buildCancellationSummary(
      billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "yearly",
          currentPeriodEnd: "2026-07-01T00:00:00Z",
        } as any,
        memberCount: 12,
      }),
    );

    expect(summary.currentPlanLabel).toBe("Business Yearly");
    expect(summary.currentPeriodEnd).toBe("2026-07-01T00:00:00Z");
    expect(summary.freePlanMemberLimit).toBe(20);
    expect(summary.willExceedFreeMemberLimit).toBe(false);
  });

  it("builds a cancellation confirmation view with downgrade details", () => {
    const viewModel = buildCompanyBillingCancellationPageViewModel({
      title: ["Acme", "Cancel plan"],
      billing: billingOverviewMock({
        memberCount: 25,
      }),
      actionError: null,
      isSubmitting: false,
      onCancelPlan: jest.fn(),
      onKeepCurrentPlan: jest.fn(),
    });

    expect(viewModel.pageTitle).toBe("Cancel plan");
    expect(viewModel.summary.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Active members", value: "25" }),
        expect.objectContaining({ label: "Free plan member limit", value: "20" }),
      ]),
    );
    expect(viewModel.summary.overLimitWarning).toContain("25 active members");
    expect(viewModel.keepAction.label).toBe("Keep current plan");
    expect(viewModel.cancelAction.label).toBe("Cancel plan");
  });
});
