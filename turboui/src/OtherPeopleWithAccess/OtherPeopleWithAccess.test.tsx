import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OtherPeopleWithAccess } from "./OtherPeopleWithAccess";
import { OtherPeopleWithAccessModal } from "./Modal";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

it("translates the empty state and the modal heading", async () => {
  await i18n.changeLanguage("pt-BR");
  render(<OtherPeopleWithAccessModal isOpen onClose={jest.fn()} people={[]} />);
  expect(screen.getByText(i18n.t("Other People with Access"))).toBeInTheDocument();
  expect(
    screen.getByText("Nenhuma outra pessoa tem acesso além das pessoas já atribuídas a este projeto."),
  ).toBeInTheDocument();
});

it("keeps literal names and looks up the description and loading heading", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Other People with Access": "Translated access heading",
      "People who have access to the project based on their company or space membership but are not directly assigned to the project.":
        "Translated access explanation",
    },
    true,
    true,
  );
  const { rerender } = render(<OtherPeopleWithAccess people={[]} loading />);
  expect(screen.getByText("Translated access heading")).toBeInTheDocument();
  rerender(<OtherPeopleWithAccess people={[{ id: "p", fullName: "Literal <name>", accessLevel: 70 }]} />);
  expect(screen.getByText("Translated access explanation")).toBeInTheDocument();
  expect(screen.getByText("Literal <name>")).toBeInTheDocument();
});

it("falls back to English", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  render(<OtherPeopleWithAccess people={[]} />);
  expect(
    screen.getByText("No one else has access beyond people already assigned to this project."),
  ).toBeInTheDocument();
});
