import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { ProductReleaseAnnouncement } from "./index";
import { v18ProductRelease } from "../HomePage/mockData";

function testId(id: string) {
  return document.querySelector(`[data-test-id="${id}"]`);
}

function renderAnnouncement(props: Partial<ProductReleaseAnnouncement.Props> = {}) {
  const onDismiss = props.onDismiss ?? jest.fn();

  return {
    onDismiss,
    ...render(
      <MemoryRouter>
        <ProductReleaseAnnouncement
          release={v18ProductRelease}
          onDismiss={onDismiss}
          formattedTimePreferences={defaultFormattedTimePreferences}
          {...props}
        />
      </MemoryRouter>,
    ),
  };
}

describe("ProductReleaseAnnouncement", () => {
  it("opens the modal from Read more", async () => {
    const user = userEvent.setup();
    renderAnnouncement();

    expect(testId("product-release-modal")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Read more" }));

    expect(testId("product-release-modal")).toBeInTheDocument();
    expect(screen.getByText(/Operately v1.8 is here/)).toBeInTheDocument();
  });

  it("calls onDismiss from the toast", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderAnnouncement();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss when the modal is closed", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderAnnouncement({ defaultModalOpen: true });

    await user.click(screen.getByLabelText("Close"));

    expect(onDismiss).not.toHaveBeenCalled();
    expect(testId("product-release-modal")).not.toBeInTheDocument();
    expect(testId("product-release-toast")).toBeInTheDocument();
  });
});
