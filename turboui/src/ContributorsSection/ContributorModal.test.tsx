import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ContributorModal } from "./ContributorModal";

const emptySearch = { people: [], onSearch: async () => undefined };

function renderModal(allowFullAccess?: boolean) {
  return render(
    <ContributorModal
      contributor={null}
      searchData={emptySearch}
      onClose={() => undefined}
      allowFullAccess={allowFullAccess}
    />,
  );
}

async function openAccessMenu() {
  const user = userEvent.setup();

  await waitFor(() => {
    expect(document.querySelector('[data-test-id="contributor-access"]')).toBeInTheDocument();
  });

  await user.click(document.querySelector('[data-test-id="contributor-access"]') as HTMLElement);
}

describe("ContributorModal access levels", () => {
  it("includes Full Access by default", async () => {
    renderModal();
    await openAccessMenu();

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="contributor-access-100"]')).toHaveTextContent("Full Access");
    });
  });

  it("hides Full Access when allowFullAccess is false", async () => {
    renderModal(false);
    await openAccessMenu();

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="contributor-access-70"]')).toHaveTextContent("Edit Access");
    });

    expect(document.querySelector('[data-test-id="contributor-access-100"]')).not.toBeInTheDocument();
    expect(screen.queryByText("Full Access")).not.toBeInTheDocument();
  });
});
