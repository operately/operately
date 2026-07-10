import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { CompanyBillingPage } from ".";

jest.mock("../icons", () => ({
  IconAlertTriangleFilled: () => <span>warning-icon</span>,
  IconCircleCheckFilled: () => <span>success-icon</span>,
  IconCircleXFilled: () => <span>error-icon</span>,
  IconInfoCircleFilled: () => <span>info-icon</span>,
}));

function billingOverviewMock() {
  return {
    account: {
      planKey: "team",
      billingInterval: "monthly",
      status: "past_due",
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
      accessState: "normal",
      accessStateReason: null,
      accessStateStartedAt: null,
      accessStateEndsAt: null,
    },
    plans: [
      { key: "free", displayName: "Free", memberLimit: 20, storageLimitBytes: 1_073_741_824 },
      { key: "team", displayName: "Team", memberLimit: 50, storageLimitBytes: 107_374_182_400 },
      { key: "business", displayName: "Business", memberLimit: 200, storageLimitBytes: 1_099_511_627_776 },
    ],
    catalogProducts: [],
    memberCount: 18,
    storageUsageBytes: 81 * 1024 ** 3,
    stale: true,
  } as any;
}

describe("CompanyBillingPage", () => {
  it("shows the refreshed stale billing warning and omits generic status badge labels", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CompanyBillingPage
          title={["Acme", "Billing"]}
          navigation={[{ label: "Company Administration", to: "/acme/admin" }]}
          billing={billingOverviewMock()}
          testId="company-billing-page"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Billing data may be out of date")).toBeInTheDocument();
    expect(
      screen.getByText("We couldn't refresh billing details the last time we checked. Reload the page to try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Danger")).not.toBeInTheDocument();
    expect(screen.queryByText("Warning")).not.toBeInTheDocument();
    expect(screen.queryByText("Info")).not.toBeInTheDocument();
  });
});
