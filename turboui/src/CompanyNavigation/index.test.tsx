import "@testing-library/jest-dom";
import { fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { CompanyNavigation } from "./index";
import { defaultProps } from "./mockData";

function renderNav(overrides: Partial<CompanyNavigation.Props> = {}) {
  return render(
    <MemoryRouter>
      <CompanyNavigation {...defaultProps} {...overrides} />
    </MemoryRouter>,
  );
}

function getByTestId(testId: string): HTMLElement {
  const element = document.querySelector(`[data-test-id="${testId}"]`);

  if (!element) {
    throw new Error(`Unable to find element with data-test-id="${testId}"`);
  }

  return element as HTMLElement;
}

describe("CompanyNavigation", () => {
  it("shows review and notification counts", () => {
    renderNav();

    expect(getByTestId("review-link-count")).toHaveTextContent("2");
    expect(getByTestId("unread-notifications-count")).toHaveTextContent("3");
  });

  it("hides counts when they are zero", () => {
    renderNav({ unreadNotificationCount: 0, reviewCount: 0 });

    expect(document.querySelector(`[data-test-id="review-link-count"]`)).not.toBeInTheDocument();
    expect(document.querySelector(`[data-test-id="unread-notifications-count"]`)).not.toBeInTheDocument();
  });

  it("hides gated new-dropdown items when permissions are off", () => {
    renderNav({
      canAddGoal: false,
      canAddProject: false,
      canAddSpace: false,
      canInvitePeople: false,
    });

    expect(document.querySelector(`[data-test-id="new-dropdown"]`)).not.toBeInTheDocument();
  });

  it("calls onLogOut from the account menu", async () => {
    const onLogOut = jest.fn();
    renderNav({ onLogOut });

    fireEvent.pointerDown(getByTestId("account-menu"));
    fireEvent.keyDown(getByTestId("account-menu"), { key: "Enter" });

    await waitFor(() => {
      expect(getByTestId("log-out-button")).toBeInTheDocument();
    });

    fireEvent.click(getByTestId("log-out-button"));

    expect(onLogOut).toHaveBeenCalled();
  });

  it("truncates long company names in the dropdown trigger", () => {
    renderNav({ companyName: "Nexus Global Manufacturing Group" });

    const trigger = getByTestId("company-dropdown");

    expect(trigger).toHaveTextContent("Nexus Global Manufactur…");
    expect(trigger).toHaveAttribute("title", "Nexus Global Manufacturing Group");
  });
});
