import * as Billing from "@/models/billing";
import React from "react";

import { BillingStatusBadge, buildStatusNotices } from "./page";
import { renderToStaticMarkup } from "react-dom/server";

function billingOverviewMock(params: Partial<Billing.BillingOverview> = {}): Billing.BillingOverview {
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
      ...(params.account || {}),
    },
    plans: [
      { key: "free", displayName: "Free", memberLimit: 20, storageLimitBytes: 1_073_741_824 },
      { key: "team", displayName: "Team", memberLimit: 50, storageLimitBytes: 107_374_182_400 },
      { key: "business", displayName: "Business", memberLimit: 200, storageLimitBytes: 1_099_511_627_776 },
    ],
    catalogProducts: [],
    memberCount: 18,
    stale: false,
    ...params,
  } as Billing.BillingOverview;
}

describe("CompanyBillingPage helpers", () => {
  it.each([
    ["free", "Free"],
    ["active", "Active"],
    ["past_due", "Past due"],
    ["canceled", "Canceled"],
  ] as const)("renders the %s status badge", (status, label) => {
    const html = renderToStaticMarkup(<BillingStatusBadge status={status} />);

    expect(html).toContain(label);
  });

  it("builds a free-plan notice when there are no pending billing changes", () => {
    const notices = buildStatusNotices(
      billingOverviewMock({
        account: {
          planKey: null,
          billingInterval: null,
          status: "free",
        } as any,
      }),
    );

    expect(notices).toEqual([
      {
        tone: "info",
        message: "Free plan",
        description: "This workspace is currently using the free plan.",
      },
    ]);
  });

  it("includes pending checkout details", () => {
    const notices = buildStatusNotices(
      billingOverviewMock({
        account: {
          pendingPlanKey: "business",
          pendingBillingInterval: "yearly",
          pendingCheckoutStartedAt: "2026-05-22T00:00:00Z",
        } as any,
      }),
    );

    expect(notices[0]).toMatchObject({
      tone: "info",
      message: "Checkout in progress",
    });
    expect(notices[0]!.description).toContain("Business Yearly");
    expect(notices[0]!.description).toContain("Checkout started");
  });

  it("includes scheduled-change and cancellation notices", () => {
    const notices = buildStatusNotices(
      billingOverviewMock({
        account: {
          cancelAtPeriodEnd: true,
          scheduledPlanKey: "business",
          scheduledBillingInterval: "yearly",
          scheduledChangeEffectiveAt: "2026-07-01T00:00:00Z",
        } as any,
      }),
    );

    expect(notices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tone: "info", message: "Scheduled plan change" }),
        expect.objectContaining({ tone: "warning", message: "Cancellation scheduled" }),
      ]),
    );
  });

  it("includes past-due and canceled warnings", () => {
    const pastDueNotices = buildStatusNotices(billingOverviewMock({ account: { status: "past_due" } as any }));
    const canceledNotices = buildStatusNotices(billingOverviewMock({ account: { status: "canceled" } as any }));

    expect(pastDueNotices).toEqual(expect.arrayContaining([expect.objectContaining({ message: "Payment issue detected" })]));
    expect(canceledNotices).toEqual(expect.arrayContaining([expect.objectContaining({ message: "Subscription ended" })]));
  });
});
