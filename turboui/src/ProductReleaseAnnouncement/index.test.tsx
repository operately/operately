import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ProductReleaseAnnouncement, PRODUCT_RELEASES_PAGE_URL } from "./index";
import { v18ProductRelease } from "./mockData";

function renderAnnouncement(props: Partial<ProductReleaseAnnouncement.Props> = {}) {
  const onDismiss = props.onDismiss ?? jest.fn();

  return {
    onDismiss,
    ...render(
      <MemoryRouter>
        <ProductReleaseAnnouncement release={v18ProductRelease} onDismiss={onDismiss} {...props} />
      </MemoryRouter>,
    ),
  };
}

describe("ProductReleaseAnnouncement", () => {
  it("links View release to the public releases page", () => {
    renderAnnouncement();

    const link = screen.getByRole("link", { name: "View release" });

    expect(link).toHaveAttribute("href", PRODUCT_RELEASES_PAGE_URL);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows the title without a subtitle", () => {
    renderAnnouncement();

    expect(screen.getByText(v18ProductRelease.title)).toBeInTheDocument();
    expect(screen.queryByText(/Bring AI into your work/)).not.toBeInTheDocument();
  });

  it("calls onDismiss from the toast", async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderAnnouncement();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
