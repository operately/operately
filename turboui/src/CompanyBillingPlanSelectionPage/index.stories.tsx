import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { CompanyBillingPlanSelectionPage } from "./index";
import { findCompanyBillingSellableProduct } from "../CompanyBillingPage";

const navigation = [
  { label: "Company Administration", to: "/acme/admin" },
  { label: "Billing", to: "/acme/admin/billing" },
];

type BillingOverviewOverrides = Omit<Partial<CompanyBillingPlanSelectionPage.BillingOverview>, "account"> & {
  account?: Partial<CompanyBillingPlanSelectionPage.BillingOverview["account"]>;
};

function billingOverviewMock(params: BillingOverviewOverrides = {}): CompanyBillingPlanSelectionPage.BillingOverview {
  const { account, ...rest } = params;

  return {
    account: {
      planKey: null,
      billingInterval: null,
      status: "free",
      suggestedPlanKey: "team",
      suggestedBillingInterval: "yearly",
      suggestedPlanSource: "website",
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
      {
        key: "enterprise",
        displayName: "Enterprise",
        tierRank: 3,
        customerSelectable: true,
        memberLimit: null,
        storageLimitBytes: null,
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
      {
        planFamily: "enterprise",
        billingInterval: "monthly",
        polarProductName: "Enterprise Monthly",
        priceAmount: 49900,
        priceCurrency: "usd",
        active: true,
      },
      {
        planFamily: "enterprise",
        billingInterval: "yearly",
        polarProductName: "Enterprise Yearly",
        priceAmount: 499000,
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

const meta: Meta<typeof CompanyBillingPlanSelectionPage> = {
  title: "Pages/CompanyBillingPlanSelectionPage",
  component: CompanyBillingPlanSelectionPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CompanyBillingPlanSelectionPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FreeCheckout: Story = {
  render: () => {
    const [selectedInterval, setSelectedInterval] = React.useState<CompanyBillingPlanSelectionPage.Interval>("yearly");
    const [selectedPlan, setSelectedPlan] = React.useState<CompanyBillingPlanSelectionPage.Plan>("team");
    const billing = billingOverviewMock();

    return (
      <CompanyBillingPlanSelectionPage
        limitsEnforced={true}
        title={["Acme", "Choose a plan"]}
        navigation={navigation}
        billing={billing}
        selection={{
          target: {
            plan: selectedPlan,
            billingInterval: selectedInterval,
            product: findCompanyBillingSellableProduct(billing.catalogProducts, selectedPlan, selectedInterval),
          },
          source: "query",
          warning: null,
        }}
        onSelectPlan={setSelectedPlan}
        onSelectInterval={setSelectedInterval}
        onSubmit={() => console.log("checkout")}
        testId="billing-plan-selection-page"
      />
    );
  },
};

export const PaidChangePlan: Story = {
  render: () => {
    const [selectedInterval, setSelectedInterval] = React.useState<CompanyBillingPlanSelectionPage.Interval>("monthly");
    const [selectedPlan, setSelectedPlan] = React.useState<CompanyBillingPlanSelectionPage.Plan>("business");
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
      },
    });

    return (
      <CompanyBillingPlanSelectionPage
        limitsEnforced={true}
        title={["Acme", "Choose a plan"]}
        navigation={navigation}
        billing={billing}
        selection={{
          target: {
            plan: selectedPlan,
            billingInterval: selectedInterval,
            product: findCompanyBillingSellableProduct(billing.catalogProducts, selectedPlan, selectedInterval),
          },
          source: "current",
          warning: null,
        }}
        onSelectPlan={setSelectedPlan}
        onSelectInterval={setSelectedInterval}
        onSubmit={() => console.log("change plan")}
        testId="billing-plan-selection-page-paid"
      />
    );
  },
};

export const ScheduledChangePreselected: Story = {
  render: () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "team",
        billingInterval: "monthly",
        status: "active",
        scheduledPlanKey: "business",
        scheduledBillingInterval: "yearly",
      },
    });

    return (
      <CompanyBillingPlanSelectionPage
        limitsEnforced={true}
        title={["Acme", "Choose a plan"]}
        navigation={navigation}
        billing={billing}
        selection={{
          target: {
            plan: "business",
            billingInterval: "yearly",
            product: findCompanyBillingSellableProduct(billing.catalogProducts, "business", "yearly"),
          },
          source: "scheduled",
          warning: null,
        }}
        onSelectPlan={() => console.log("select plan")}
        onSelectInterval={() => console.log("select interval")}
        onSubmit={() => console.log("change plan")}
        testId="billing-plan-selection-page-scheduled"
      />
    );
  },
};

export const OverLimitDowngradePreview: Story = {
  render: () => {
    const [selectedInterval, setSelectedInterval] = React.useState<CompanyBillingPlanSelectionPage.Interval>("monthly");
    const [selectedPlan, setSelectedPlan] = React.useState<CompanyBillingPlanSelectionPage.Plan>("team");
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-14T00:00:00Z",
      },
      memberCount: 60,
      storageUsageBytes: 128_849_018_880,
    });

    return (
      <CompanyBillingPlanSelectionPage
        limitsEnforced={true}
        title={["Acme", "Choose a plan"]}
        navigation={navigation}
        billing={billing}
        selection={{
          target: {
            plan: selectedPlan,
            billingInterval: selectedInterval,
            product: findCompanyBillingSellableProduct(billing.catalogProducts, selectedPlan, selectedInterval),
          },
          source: "query",
          warning: null,
        }}
        onSelectPlan={setSelectedPlan}
        onSelectInterval={setSelectedInterval}
        onSubmit={() => console.log("change plan")}
        testId="billing-plan-selection-page-over-limit-downgrade"
      />
    );
  },
};

export const MemberOverLimitDowngradePreview: Story = {
  render: () => {
    const [selectedInterval, setSelectedInterval] = React.useState<CompanyBillingPlanSelectionPage.Interval>("monthly");
    const [selectedPlan, setSelectedPlan] = React.useState<CompanyBillingPlanSelectionPage.Plan>("team");
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-14T00:00:00Z",
      },
      memberCount: 60,
      storageUsageBytes: 85_899_345_920,
    });

    return (
      <CompanyBillingPlanSelectionPage
        limitsEnforced={true}
        title={["Acme", "Choose a plan"]}
        navigation={navigation}
        billing={billing}
        selection={{
          target: {
            plan: selectedPlan,
            billingInterval: selectedInterval,
            product: findCompanyBillingSellableProduct(billing.catalogProducts, selectedPlan, selectedInterval),
          },
          source: "query",
          warning: null,
        }}
        onSelectPlan={setSelectedPlan}
        onSelectInterval={setSelectedInterval}
        onSubmit={() => console.log("change plan")}
        testId="billing-plan-selection-page-member-over-limit-downgrade"
      />
    );
  },
};

export const CommerceFirstDowngradePreview: Story = {
  render: () => {
    const billing = billingOverviewMock({
      account: {
        planKey: "business",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-14T00:00:00Z",
      },
      memberCount: 60,
      storageUsageBytes: 128_849_018_880,
    });

    return (
      <CompanyBillingPlanSelectionPage
        limitsEnforced={false}
        title={["Acme", "Choose a plan"]}
        navigation={navigation}
        billing={billing}
        selection={{
          target: {
            plan: "team",
            billingInterval: "monthly",
            product: findCompanyBillingSellableProduct(billing.catalogProducts, "team", "monthly"),
          },
          source: "query",
          warning: null,
        }}
        testId="billing-plan-selection-page-commerce-first"
      />
    );
  },
};

export const MissingYearlyOption: Story = {
  render: () => {
    const billing = billingOverviewMock({
      catalogProducts: billingOverviewMock().catalogProducts.filter(
        (product) => !(product.planFamily === "business" && product.billingInterval === "yearly"),
      ),
    });

    return (
      <CompanyBillingPlanSelectionPage
        limitsEnforced={true}
        title={["Acme", "Choose a plan"]}
        navigation={navigation}
        billing={billing}
        selection={{
          target: {
            plan: "team",
            billingInterval: "yearly",
            product: findCompanyBillingSellableProduct(billing.catalogProducts, "team", "yearly"),
          },
          source: "suggested",
          warning: null,
        }}
        onSelectPlan={() => console.log("select plan")}
        onSelectInterval={() => console.log("select interval")}
        onSubmit={() => console.log("checkout")}
        testId="billing-plan-selection-page-missing-option"
      />
    );
  },
};
