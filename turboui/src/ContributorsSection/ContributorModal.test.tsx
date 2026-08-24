import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ContributorModal } from "./ContributorModal";

const emptySearch = { people: [], onSearch: async () => undefined };

function renderModal({
  allowFullAccess,
  contributor = null,
  onUpdate,
}: {
  allowFullAccess?: boolean;
  contributor?: React.ComponentProps<typeof ContributorModal>["contributor"];
  onUpdate?: React.ComponentProps<typeof ContributorModal>["onUpdate"];
} = {}) {
  return render(
    <ContributorModal
      contributor={contributor}
      searchData={emptySearch}
      onClose={() => undefined}
      allowFullAccess={allowFullAccess}
      onUpdate={onUpdate}
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
    renderModal({ allowFullAccess: false });
    await openAccessMenu();

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="contributor-access-70"]')).toHaveTextContent("Edit Access");
    });

    expect(document.querySelector('[data-test-id="contributor-access-100"]')).not.toBeInTheDocument();
    expect(screen.queryByText("Full Access")).not.toBeInTheDocument();
  });

  it("shows a read-only Full Access field when the viewer cannot change it", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn().mockResolvedValue(true);
    const person = { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null };

    renderModal({
      allowFullAccess: false,
      contributor: { id: "contributor-1", person, accessLevel: 100 },
      onUpdate,
    });

    await waitFor(() => {
      expect(document.querySelector('[data-test-id="contributor-access"]')).toHaveTextContent("Full Access");
    });

    await user.click(document.querySelector('[data-test-id="contributor-access"]') as HTMLElement);
    expect(document.querySelector('[data-test-id="contributor-access-70"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="contributor-access-100"]')).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save contributor" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("contributor-1", {
        person,
        responsibility: null,
      });
    });
  });

  it("does not persist access until Save contributor is clicked", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn().mockResolvedValue(true);
    const person = { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null };
    renderModal({
      contributor: { id: "contributor-1", person, accessLevel: 70 },
      onUpdate,
    });

    await openAccessMenu();
    await waitFor(() => {
      expect(document.querySelector('[data-test-id="contributor-access-10"]')).toBeInTheDocument();
    });
    await user.click(document.querySelector('[data-test-id="contributor-access-10"]') as HTMLElement);

    expect(onUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save contributor" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("contributor-1", {
        person,
        responsibility: null,
        accessLevel: 10,
      });
    });
  });
});
