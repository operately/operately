import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { CompanyBillingCancellationPage } from "./index";

const navigation = [
  { label: "Company Administration", to: "/acme/admin" },
  { label: "Billing", to: "/acme/admin/billing" },
];

type BillingOverviewOverrides = Omit<Partial<CompanyBillingCancellationPage.BillingOverview>, "account"> & {
  account?: Partial<CompanyBillingCancellationPage.BillingOverview["account"]>;
};

function billingOverviewMock(params: BillingOverviewOverrides = {}): CompanyBillingCancellationPage.BillingOverview {
  const { account, ...rest } = params;

  return {
    account: {
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
  };
}

const meta: Meta<typeof CompanyBillingCancellationPage> = {
  title: "Pages/CompanyBillingCancellationPage",
  component: CompanyBillingCancellationPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CompanyBillingCancellationPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NormalPaidCancellation: Story = {
  render: () => (
    <CompanyBillingCancellationPage
      title={["Acme", "Cancel plan"]}
      navigation={navigation}
      billing={billingOverviewMock()}
      onKeepCurrentPlan={() => console.log("keep")}
      onCancelPlan={() => console.log("cancel")}
      testId="billing-cancellation-page"
    />
  ),
};

export const OverFreeLimitWarning: Story = {
  render: () => (
    <CompanyBillingCancellationPage
      title={["Acme", "Cancel plan"]}
      navigation={navigation}
      billing={billingOverviewMock({ memberCount: 25 })}
      onKeepCurrentPlan={() => console.log("keep")}
      onCancelPlan={() => console.log("cancel")}
      testId="billing-cancellation-page-over-limit"
    />
  ),
};

export const SafeWithinFreeLimit: Story = {
  render: () => (
    <CompanyBillingCancellationPage
      title={["Acme", "Cancel plan"]}
      navigation={navigation}
      billing={billingOverviewMock({ memberCount: 8 })}
      onKeepCurrentPlan={() => console.log("keep")}
      onCancelPlan={() => console.log("cancel")}
      testId="billing-cancellation-page-within-limit"
    />
  ),
};
