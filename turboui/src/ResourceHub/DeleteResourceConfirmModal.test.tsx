import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DeleteResourceConfirmModal } from "./DeleteResourceConfirmModal";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

test("allows a translation to reorder the document name while preserving confirmation", async () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      'Are you sure you want to delete the document "<name>{{resourceName}}</name>"?':
        "<name>{{resourceName}}</name>: expanded document deletion confirmation?",
      Delete: "Translated delete",
    },
    true,
    true,
  );
  const onConfirm = jest.fn().mockResolvedValue(undefined);
  render(
    <DeleteResourceConfirmModal
      isOpen
      onClose={jest.fn()}
      resourceType="document"
      resourceName="Research & development"
      onConfirm={onConfirm}
    />,
  );
  const name = screen.getByText("Research & development");
  expect(name.tagName).toBe("B");
  expect(name.parentElement).toHaveTextContent("Research & development: expanded document deletion confirmation?");
  fireEvent.click(screen.getByRole("button", { name: "Translated delete" }));
  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
});
