import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DiscardDiscussionDraftModal } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";
import { showSuccessToast } from "../Toasts";

jest.mock("../Toasts", () => ({ showSuccessToast: jest.fn() }));

setupTestCatalog();
afterEach(() => jest.clearAllMocks());

it("looks up the discard confirmation and success feedback while preserving the action", async () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Are you sure you want to discard this draft?": "Expanded translated draft confirmation for the discussion",
      "Discard draft": "Translated discard draft",
      "Draft discarded": "Translated success title",
      "The draft has been discarded.": "Translated success body",
    },
    true,
    true,
  );
  const onDiscard = jest.fn().mockResolvedValue(undefined);
  const onSuccess = jest.fn();
  render(<DiscardDiscussionDraftModal isOpen onClose={jest.fn()} onDiscard={onDiscard} onSuccess={onSuccess} />);

  expect(screen.getByText("Expanded translated draft confirmation for the discussion")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Translated discard draft" }));
  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(onDiscard).toHaveBeenCalledTimes(1);
  expect(showSuccessToast).toHaveBeenCalledWith("Translated success title", "Translated success body");
});

it("falls back to the current English confirmation when Portuguese is missing", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  render(<DiscardDiscussionDraftModal isOpen onClose={jest.fn()} onDiscard={jest.fn()} onSuccess={jest.fn()} />);
  expect(screen.getByText("Are you sure you want to discard this draft?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Discard draft" })).toBeInTheDocument();
});
