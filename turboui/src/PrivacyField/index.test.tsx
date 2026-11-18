import { i18n, setupTestCatalog } from "../../test/i18n";
import React from "react";
import { configure, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PrivacyField } from ".";

configure({ testIdAttribute: "data-test-id" });
setupTestCatalog();

it.each([
  { language: "en", resourceType: "goal" as const, title: "Access" },
  { language: "pt-BR", resourceType: "goal" as const, title: "Acesso" },
  { language: "en", resourceType: "project" as const, title: "Privacy Settings" },
])("titles the opened $resourceType popover in $language", async ({ language, resourceType, title }) => {
  await i18n.changeLanguage(language);
  render(
    <PrivacyField
      resourceType={resourceType}
      accessLevels={{ company: "view", space: "edit" }}
      setAccessLevels={jest.fn()}
    />,
  );
  fireEvent.click(screen.getByTestId("privacy-field"));

  const popover = within(screen.getByRole("dialog"));
  expect(popover.getByText(title, { exact: true })).toBeInTheDocument();
  expect(popover.getByTestId("privacy-field-company-select")).toHaveValue("view");
  expect(popover.getByTestId("privacy-field-space-select")).toHaveValue("edit");
});

it("cancels draft changes and saves selected goal access levels", () => {
  const setAccessLevels = jest.fn();
  render(
    <PrivacyField
      resourceType="goal"
      accessLevels={{ company: "view", space: "edit" }}
      setAccessLevels={setAccessLevels}
    />,
  );
  fireEvent.click(screen.getByTestId("privacy-field"));
  fireEvent.change(screen.getByTestId("privacy-field-space-select"), { target: { value: "full" } });
  fireEvent.click(screen.getByTestId("cancel"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(setAccessLevels).not.toHaveBeenCalled();

  fireEvent.click(screen.getByTestId("privacy-field"));
  expect(screen.getByTestId("privacy-field-space-select")).toHaveValue("edit");
  fireEvent.change(screen.getByTestId("privacy-field-space-select"), { target: { value: "full" } });
  fireEvent.click(screen.getByTestId("save"));
  expect(setAccessLevels).toHaveBeenCalledWith({ company: "view", space: "full" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
