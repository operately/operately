import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { HomePage } from "./index";
import { MockFeed, mockSpaces, v18ProductRelease } from "./mockData";

function renderHomePage(props: Partial<HomePage.Props> = {}) {
  return render(
    <MemoryRouter>
      <HomePage
        firstName="Ada"
        now={new Date("2026-07-17T09:00:00")}
        spaces={mockSpaces}
        canCreateSpace
        canInviteMembers
        newSpaceLink="/spaces/new"
        invitePeopleLink="/people/invite"
        feed={<MockFeed />}
        productRelease={v18ProductRelease}
        onDismissProductRelease={jest.fn()}
        formattedTimePreferences={defaultFormattedTimePreferences}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("greets the person by first name", () => {
    renderHomePage();

    expect(screen.getByText("Good morning, Ada!")).toBeInTheDocument();
  });

  it("shows space cards", () => {
    renderHomePage();

    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.queryByTestId("spaces-zero-state")).not.toBeInTheDocument();
  });

  it("shows the spaces zero state when there are no spaces", () => {
    renderHomePage({ spaces: [] });

    expect(document.querySelector('[data-test-id="spaces-zero-state"]')).toBeInTheDocument();
  });

  it("hides the release toast when there is no release", () => {
    renderHomePage({ productRelease: null });

    expect(document.querySelector('[data-test-id="product-release-toast"]')).not.toBeInTheDocument();
  });

  it("shows the release toast when a release is present", () => {
    renderHomePage();

    expect(document.querySelector('[data-test-id="product-release-toast"]')).toBeInTheDocument();
  });
});
