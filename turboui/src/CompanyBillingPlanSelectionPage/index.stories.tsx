import type { Meta, StoryObj } from "@storybook/react";
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
      { key: "free", displayName: "Free", memberLimit: 20, storageLimitBytes: 1_073_741_824 },
      { key: "team", displayName: "Team", memberLimit: 50, storageLimitBytes: 107_374_182_400 },
      { key: "business", displayName: "Business", memberLimit: 200, storageLimitBytes: 1_099_511_627_776 },
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

export const Default: Story = {
  render: () => {
    const [selectedInterval, setSelectedInterval] = React.useState<CompanyBillingPlanSelectionPage.Interval>("yearly");
    const [selectedPlan, setSelectedPlan] = React.useState<CompanyBillingPlanSelectionPage.Plan>("team");
    const billing = billingOverviewMock();

    return (
      <CompanyBillingPlanSelectionPage
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
        onContinueToCheckout={() => console.log("checkout")}
        testId="billing-plan-selection-page"
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
        onContinueToCheckout={() => console.log("checkout")}
        testId="billing-plan-selection-page-missing-option"
      />
    );
  },
};
