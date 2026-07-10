import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { CompanyBillingPage } from "./index";

const navigation = [{ label: "Company Administration", to: "/acme/admin" }];

type BillingOverviewOverrides = Omit<Partial<CompanyBillingPage.BillingOverview>, "account"> & {
  account?: Partial<CompanyBillingPage.BillingAccount>;
};

function billingOverviewMock(params: BillingOverviewOverrides = {}): CompanyBillingPage.BillingOverview {
  const { account, ...rest } = params;

  return {
    account: {
      planKey: null,
      billingInterval: null,
      status: "free",
      suggestedPlanKey: null,
      suggestedBillingInterval: null,
      suggestedPlanSource: null,
      currentPeriodEnd: null,
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
      {
        key: "free",
        displayName: "Free",
        tierRank: 0,
        customerSelectable: false,
        memberLimit: 20,
        storageLimitBytes: 1_073_741_824,
      },
      {
        key: "team",
        displayName: "Team",
        tierRank: 1,
        customerSelectable: true,
        memberLimit: 50,
        storageLimitBytes: 107_374_182_400,
      },
      {
        key: "business",
        displayName: "Business",
        tierRank: 2,
        customerSelectable: true,
        memberLimit: 200,
        storageLimitBytes: 1_099_511_627_776,
      },
    ],
    catalogProducts: [
      {
        planFamily: "team",
        billingInterval: "monthly",
        polarProductName: "Team Monthly",
        priceAmount: 7900,
        priceCurrency: "usd",
        active: true,
      },
      {
        planFamily: "team",
        billingInterval: "yearly",
        polarProductName: "Team Yearly",
        priceAmount: 79000,
        priceCurrency: "usd",
        active: true,
      },
      {
        planFamily: "business",
        billingInterval: "monthly",
        polarProductName: "Business Monthly",
        priceAmount: 19900,
        priceCurrency: "usd",
        active: true,
      },
      {
        planFamily: "business",
        billingInterval: "yearly",
        polarProductName: "Business Yearly",
        priceAmount: 199000,
        priceCurrency: "usd",
        active: true,
      },
    ],
    memberCount: 18,
    storageUsageBytes: 858_993_459,
    stale: false,
    ...rest,
  };
}

const meta: Meta<typeof CompanyBillingPage> = {
  title: "Pages/CompanyBillingPage",
  component: CompanyBillingPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CompanyBillingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FreeOverview: Story = {
  render: () => {
    const billing = billingOverviewMock();

    return (
      <CompanyBillingPage
        title={["Acme", "Billing"]}
        navigation={navigation}
        billing={billing}
        onOpenSelection={() => console.log("switch plan")}
        testId="billing-page-free-overview"
      />
    );
  },
};

export const PendingCheckoutOverview: Story = {
  render: () => {
    const billing = billingOverviewMock({
      account: {
        pendingPlanKey: "team",
        pendingBillingInterval: "yearly",
        pendingCheckoutStartedAt: "2026-05-22T00:00:00Z",
      },
    });

    return (
      <CompanyBillingPage
        title={["Acme", "Billing"]}
        navigation={navigation}
        billing={billing}
        feedback={{
          kind: "pending",
          message: "Checkout not completed yet",
          description: "You can start checkout again for Team Yearly.",
        }}
        onOpenSelection={() => console.log("switch plan")}
        onCompleteUpgrade={() => console.log("complete")}
        testId="billing-page-pending-overview"
      />
    );
  },
};

export const ConfirmingUpgrade: Story = {
  render: () => {
    return (
      <CompanyBillingPage
        title={["Acme", "Billing"]}
        navigation={navigation}
        billing={billingOverviewMock()}
        isConfirmingCheckout={true}
        confirmingTarget={{
          plan: "team",
          billingInterval: "yearly",
          product: null,
        }}
        testId="billing-page-confirming"
      />
    );
  },
};

export const PaidActiveOverview: Story = {
  render: () => (
    <CompanyBillingPage
      title={["Acme", "Billing"]}
      navigation={navigation}
      billing={billingOverviewMock({
        account: {
          planKey: "business",
          billingInterval: "monthly",
          status: "active",
          currentPeriodEnd: "2026-06-14T00:00:00Z",
        },
        memberCount: 42,
      })}
      onOpenSelection={() => console.log("switch plan")}
      onCancelPlan={() => console.log("cancel plan")}
      onUpdatePaymentMethod={() => console.log("update card")}
      onManageBilling={() => console.log("manage billing")}
      testId="billing-page-paid-active"
    />
  ),
};

export const PastDueOverview: Story = {
  render: () => (
    <CompanyBillingPage
      title={["Acme", "Billing"]}
      navigation={navigation}
      billing={billingOverviewMock({
        account: {
          planKey: "team",
          billingInterval: "yearly",
          status: "past_due",
          currentPeriodEnd: "2026-06-14T00:00:00Z",
        },
      })}
      onOpenSelection={() => console.log("switch plan")}
      onCancelPlan={() => console.log("cancel plan")}
      onUpdatePaymentMethod={() => console.log("update card")}
      onManageBilling={() => console.log("manage billing")}
      testId="billing-page-past-due"
    />
  ),
};

export const PendingCancelOverview: Story = {
  render: () => (
    <CompanyBillingPage
      title={["Acme", "Billing"]}
      navigation={navigation}
      billing={billingOverviewMock({
        account: {
          planKey: "team",
          billingInterval: "monthly",
          status: "active",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: "2026-06-14T00:00:00Z",
        },
      })}
      onOpenSelection={() => console.log("switch plan")}
      onReactivatePlan={() => console.log("reactivate")}
      onUpdatePaymentMethod={() => console.log("update card")}
      onManageBilling={() => console.log("manage billing")}
      testId="billing-page-pending-cancel"
    />
  ),
};
