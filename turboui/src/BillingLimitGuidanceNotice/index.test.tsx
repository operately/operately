import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import { BillingLimitGuidanceNotice } from ".";

jest.mock("../Modal", () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../icons", () => ({
  IconAlertTriangleFilled: () => <span>icon</span>,
}));

function renderNotice(
  guidance: {
    title: string;
    description: string;
    usageSummary: string;
    recommendedPlanLabel: string | null;
    cta: { label: string; to: string } | null;
  },
) {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BillingLimitGuidanceNotice isOpen={true} onClose={jest.fn()} guidance={guidance as any} />
    </MemoryRouter>,
  );
}

describe("BillingLimitGuidanceNotice", () => {
  it("shows the manager fallback next step when a CTA is available without a recommended plan", () => {
    renderNotice({
      title: "This company has reached its member limit",
      description: "Review billing to change the plan and add or restore people.",
      usageSummary: "This company has 20 active members. The plan includes 20.",
      recommendedPlanLabel: null,
      cta: { label: "Review billing", to: "/acme/admin/billing" },
    });

    expect(screen.getByText("Choose a plan with more member capacity.")).toBeInTheDocument();
  });

  it("shows the non-manager fallback next step when no CTA is available", () => {
    renderNotice({
      title: "This company has reached its member limit",
      description: "Contact an admin or owner to review billing and change the plan before trying again.",
      usageSummary: "This company has 20 active members. The plan includes 20.",
      recommendedPlanLabel: null,
      cta: null,
    });

    expect(screen.getByText("An admin or owner needs to choose a plan with more member capacity.")).toBeInTheDocument();
  });
});
