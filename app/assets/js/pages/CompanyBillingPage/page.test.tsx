import * as Billing from "@/models/billing";
import { isAwaitingCheckoutConfirmation, resolveCheckoutConfirmation } from "./page";

import {
  buildCompanyBillingCancellationFeedback,
  buildCompanyBillingConfirmingMode,
  buildCompanyBillingOverviewMode,
  buildCompanyBillingPlanChangeFeedback,
  buildCompanyBillingReactivationFeedback,
  buildCompanyBillingRecoveryFeedback,
  buildCompanyBillingStatusNotices,
  buildCompanyBillingSuccessFeedback,
} from "turboui";

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
    catalogProducts: [
      {
        id: "team-monthly",
        provider: "polar",
        planFamily: "team",
        billingInterval: "monthly",
        polarProductId: "pol_team_monthly",
        polarProductName: "Team Monthly",
        priceAmount: 7900,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
      {
        id: "team-yearly",
        provider: "polar",
        planFamily: "team",
        billingInterval: "yearly",
        polarProductId: "pol_team_yearly",
        polarProductName: "Team Yearly",
        priceAmount: 79000,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
      {
        id: "business-monthly",
        provider: "polar",
        planFamily: "business",
        billingInterval: "monthly",
        polarProductId: "pol_business_monthly",
        polarProductName: "Business Monthly",
        priceAmount: 19900,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
      {
        id: "business-yearly",
        provider: "polar",
        planFamily: "business",
        billingInterval: "yearly",
        polarProductId: "pol_business_yearly",
        polarProductName: "Business Yearly",
        priceAmount: 199000,
        priceCurrency: "usd",
        version: 1,
        active: true,
        archivedAt: null,
        lastSyncedAt: "2026-05-23T00:00:00Z",
        insertedAt: "2026-05-23T00:00:00Z",
        updatedAt: "2026-05-23T00:00:00Z",
      },
    ],
    memberCount: 18,
    storageUsageBytes: 81 * 1024 ** 3,
    stale: false,
    ...rest,
  } as Billing.BillingOverview;
}

describe("CompanyBillingPage bridge helpers", () => {
  it("builds a free-plan notice when there are no pending billing changes", () => {
    const notices = buildCompanyBillingStatusNotices(
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
        description: "This company is currently using the free plan.",
      },
    ]);
  });

  it("includes pending checkout details", () => {
    const notices = buildCompanyBillingStatusNotices(
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
    const notices = buildCompanyBillingStatusNotices(
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

  it("keeps checkout recovery and plan switching actions for free companies", () => {
    const overview = buildCompanyBillingOverviewMode({
      billing: billingOverviewMock({
        account: {
          planKey: null,
          billingInterval: null,
          status: "free",
          pendingPlanKey: "team",
          pendingBillingInterval: "yearly",
        } as any,
      }),
      feedback: null,
      actionError: null,
      onSeePlans: jest.fn(),
      onCompleteUpgrade: jest.fn(),
      onCancelPlan: null,
      onReactivatePlan: null,
      onUpdatePaymentMethod: null,
      onManageBilling: null,
    });

    expect(overview.actions.map((action) => action.label)).toEqual(["Complete upgrade", "Switch Plan"]);
    expect(overview.actions[0]?.tone).toBe("primary");
    expect(overview.actions[1]?.tone).toBe("secondary");
    expect(overview.usageRows).toEqual([
      { label: "Active members", value: "18 / 20" },
      { label: "Storage used", value: "81 GB / 1 GB" },
    ]);
  });

  it("shows paid subscription actions for active and past-due companies", () => {
    const overview = buildCompanyBillingOverviewMode({
      billing: billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "monthly",
          status: "past_due",
        } as any,
      }),
      feedback: null,
      actionError: null,
      onSeePlans: jest.fn(),
      onCompleteUpgrade: null,
      onCancelPlan: jest.fn(),
      onReactivatePlan: null,
      onUpdatePaymentMethod: jest.fn(),
      onManageBilling: jest.fn(),
    });

    expect(overview.actions.map((action) => action.label)).toEqual([
      "Switch Plan",
      "Update credit card",
      "Manage billing",
      "Cancel plan",
    ]);
  });

  it("shows reactivation instead of cancellation when a paid plan is already ending", () => {
    const overview = buildCompanyBillingOverviewMode({
      billing: billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "monthly",
          status: "active",
          cancelAtPeriodEnd: true,
        } as any,
      }),
      feedback: null,
      actionError: null,
      onSeePlans: jest.fn(),
      onCompleteUpgrade: null,
      onCancelPlan: null,
      onReactivatePlan: jest.fn(),
      onUpdatePaymentMethod: jest.fn(),
      onManageBilling: jest.fn(),
    });

    expect(overview.actions.map((action) => action.label)).toEqual([
      "Switch Plan",
      "Reactivate plan",
      "Update credit card",
      "Manage billing",
    ]);
  });

  it("builds confirming mode details", () => {
    const confirming = buildCompanyBillingConfirmingMode({ plan: "team", billingInterval: "yearly", product: null });

    expect(confirming.notice.message).toBe("Confirming your upgrade");
    expect(confirming.notice.description).toContain("update automatically");
    expect(confirming.rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: "Requested plan", value: "Team Yearly" })]),
    );
  });

  it("waits for webhook-driven confirmation only while checkout has not been confirmed", () => {
    const pendingBilling = billingOverviewMock({
      account: {
        planKey: null,
        billingInterval: null,
        status: "free",
        pendingPlanKey: "team",
        pendingBillingInterval: "yearly",
      } as any,
    });

    const paidBilling = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "yearly",
        status: "active",
        pendingPlanKey: null,
        pendingBillingInterval: null,
      } as any,
    });

    const target = { plan: "team" as const, billingInterval: "yearly" as const, product: null };

    expect(isAwaitingCheckoutConfirmation(pendingBilling, "chk_123", target)).toBe(true);
    expect(isAwaitingCheckoutConfirmation(paidBilling, "chk_123", target)).toBe(false);
    expect(isAwaitingCheckoutConfirmation(pendingBilling, null, target)).toBe(false);
  });

  it("resolves checkout confirmation only after the billing update reflects a paid state", () => {
    const pendingBilling = billingOverviewMock({
      account: {
        planKey: null,
        billingInterval: null,
        status: "free",
        pendingPlanKey: "team",
        pendingBillingInterval: "yearly",
      } as any,
    });

    const paidBilling = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "yearly",
        status: "active",
        pendingPlanKey: null,
        pendingBillingInterval: null,
      } as any,
    });

    expect(resolveCheckoutConfirmation(pendingBilling, "chk_123")).toEqual({
      checkoutResolved: false,
      feedback: null,
    });

    expect(resolveCheckoutConfirmation(paidBilling, "chk_123")).toMatchObject({
      checkoutResolved: true,
      feedback: expect.objectContaining({ kind: "success", message: "Upgrade confirmed" }),
    });
  });

  it("keeps the checkout return stable when a billing refresh is still unresolved", () => {
    const unresolvedBilling = billingOverviewMock({
      account: {
        planKey: null,
        billingInterval: null,
        status: "free",
        pendingPlanKey: "business",
        pendingBillingInterval: "monthly",
      } as any,
    });

    expect(() => resolveCheckoutConfirmation(unresolvedBilling, "chk_123")).not.toThrow();
    expect(resolveCheckoutConfirmation(unresolvedBilling, "chk_123")).toEqual({
      checkoutResolved: false,
      feedback: null,
    });
  });

  it("builds checkout success and recovery feedback", () => {
    const success = buildCompanyBillingSuccessFeedback(
      billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "monthly",
          status: "active",
        } as any,
      }),
    );

    const recovery = buildCompanyBillingRecoveryFeedback(
      billingOverviewMock({
        account: {
          planKey: null,
          billingInterval: null,
          status: "free",
          pendingPlanKey: "team",
          pendingBillingInterval: "monthly",
        } as any,
      }),
    );

    expect(success).toMatchObject({ kind: "success", message: "Upgrade confirmed" });
    expect(recovery).toMatchObject({ kind: "pending", message: "Checkout not completed yet" });
  });

  it("builds plan-change success feedback for immediate and scheduled changes", () => {
    const immediateFeedback = buildCompanyBillingPlanChangeFeedback(
      billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "monthly",
          status: "active",
        } as any,
      }),
    );

    const scheduledFeedback = buildCompanyBillingPlanChangeFeedback(
      billingOverviewMock({
        account: {
          planKey: "team",
          billingInterval: "monthly",
          status: "active",
          scheduledPlanKey: "business",
          scheduledBillingInterval: "yearly",
          scheduledChangeEffectiveAt: "2026-06-14T00:00:00Z",
        } as any,
      }),
    );

    expect(immediateFeedback).toMatchObject({ kind: "success", message: "Plan updated" });
    expect(scheduledFeedback).toMatchObject({ kind: "success", message: "Plan change scheduled" });
    expect(scheduledFeedback.description).toContain("Business Yearly");
  });

  it("builds cancellation and reactivation feedback", () => {
    const scheduledCancellationFeedback = buildCompanyBillingCancellationFeedback(
      billingOverviewMock({
        account: {
          planKey: "team",
          billingInterval: "monthly",
          status: "active",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: "2026-06-14T00:00:00Z",
        } as any,
      }),
    );

    const reactivationFeedback = buildCompanyBillingReactivationFeedback(
      billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "yearly",
          status: "active",
          cancelAtPeriodEnd: false,
        } as any,
      }),
    );

    expect(scheduledCancellationFeedback).toMatchObject({ kind: "success", message: "Cancellation scheduled" });
    expect(scheduledCancellationFeedback.description).toContain("2026");
    expect(reactivationFeedback).toMatchObject({ kind: "success", message: "Plan reactivated" });
    expect(reactivationFeedback.description).toContain("Business Yearly");
  });
});
