import React from "react";
import { configure, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import "../i18n";

import { AccountSettingsPage } from ".";

configure({ testIdAttribute: "data-test-id" });

function renderPage(overrides: Partial<AccountSettingsPage.Props> = {}) {
  const props: AccountSettingsPage.Props = {
    homePath: "/",
    accountPath: "/account",
    preferences: { theme: "system", language: "en", timezone: "Europe/Berlin", timeFormat: "automatic" },
    timezones: [
      { value: "Europe/Berlin", label: "Europe/Berlin" },
      { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
    ],
    onSave: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <AccountSettingsPage {...props} />
    </MemoryRouter>,
  );
  return props;
}

it.each([
  ["de", "Deutsch"],
  ["ru", "Русский"],
  ["fr", "Français"],
  ["es", "Español"],
  ["pt-BR", "Português (Brasil)"],
] as const)("loads and saves the %s language preference", async (language, label) => {
  const { onSave } = renderPage();
  expect(screen.getByTestId("language")).toHaveAccessibleName("Language");
  fireEvent.click(screen.getByTestId("language"));
  fireEvent.click(screen.getByTestId(`language-option-${language}`));
  expect(screen.getByTestId("language")).toHaveTextContent(label);
  fireEvent.click(screen.getByTestId("submit"));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ language })));
});

it("saves theme, timezone, and clock format together", async () => {
  const { onSave } = renderPage();
  expect(screen.getByTestId("theme-system")).toBeChecked();
  fireEvent.click(screen.getByTestId("theme-dark"));
  fireEvent.click(screen.getByTestId("timezone"));
  fireEvent.click(screen.getByRole("button", { name: "America/Sao_Paulo" }));
  fireEvent.click(screen.getByTestId("time-format"));
  fireEvent.click(screen.getByRole("button", { name: "24-hour clock" }));
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("submit"));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      theme: "dark",
      language: "en",
      timezone: "America/Sao_Paulo",
      timeFormat: "hour_24",
    }),
  );
});

it("retains the draft after a failed save and allows retrying", async () => {
  const onSave = jest.fn().mockRejectedValueOnce(new Error("Failed")).mockResolvedValue(undefined);
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    renderPage({ onSave });
    fireEvent.click(screen.getByTestId("theme-light"));
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByTestId("theme-light")).toBeChecked();
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  } finally {
    log.mockRestore();
  }
});
