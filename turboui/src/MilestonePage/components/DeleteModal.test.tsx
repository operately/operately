import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

import { i18n, setupTestCatalog } from "../../../test/i18n";
import { DeleteModal } from "./DeleteModal";

setupTestCatalog();

test("uses substituted catalog copy for the dialog title", () => {
  i18n.addResourceBundle("en", "translation", { "Delete Milestone": "Translated delete milestone" }, true, true);

  render(<DeleteModal isDeleteModalOpen closeDeleteModal={jest.fn()} onDelete={jest.fn()} />);

  expect(screen.getByRole("dialog", { name: "Translated delete milestone" })).toBeInTheDocument();
});
