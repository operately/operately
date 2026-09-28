import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { GoalAddForm } from ".";
import { showErrorToast } from "../Toasts";
import { i18n, setupTestCatalog } from "../../test/i18n";

jest.mock("../Toasts", () => ({ showErrorToast: jest.fn() }));
setupTestCatalog();

test.each(["en", "pt-BR"])("validates a goal and preserves the user's name when saving in %s", async (language) => {
  await i18n.changeLanguage(language);
  const save = jest.fn().mockResolvedValue({ id: "new-goal" });
  const onSuccess = jest.fn();
  render(
    <MemoryRouter>
      <GoalAddForm
        space={{ id: "space", name: "Research", link: "/spaces/research" }}
        spaceSearch={async () => []}
        save={save}
        onSuccess={onSuccess}
      />
    </MemoryRouter>,
  );
  const button = screen.getByRole("button", { name: i18n.t("Add Goal") });
  fireEvent.click(button);
  expect(save).not.toHaveBeenCalled();
  expect(await screen.findByText(i18n.t("Cannot be empty"))).toBeInTheDocument();
  const name = screen.getByPlaceholderText(i18n.t("What do you want to achieve?"));
  fireEvent.change(name, { target: { value: "Research & discovery" } });
  fireEvent.blur(name);
  fireEvent.click(button);
  await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("new-goal"));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: "Research & discovery", spaceId: "space" }));
});

test("looks up goal validation and operation errors in the catalog", async () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Cannot be empty": "Translated validation",
      "Network error": "Translated failure title",
      "Failed to create the goal": "Translated failure body",
    },
    true,
    true,
  );
  const save = jest.fn().mockRejectedValue(new Error("network"));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    render(
      <MemoryRouter>
        <GoalAddForm
          space={{ id: "space", name: "Research", link: "/spaces/research" }}
          spaceSearch={async () => []}
          save={save}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Goal" }));
    expect(await screen.findByText("Translated validation")).toBeInTheDocument();
  const name = screen.getByPlaceholderText(i18n.t("What do you want to achieve?"));
    fireEvent.change(name, { target: { value: "Original name" } });
    fireEvent.blur(name);
    fireEvent.click(screen.getByRole("button", { name: "Add Goal" }));
    await waitFor(() =>
      expect(showErrorToast).toHaveBeenCalledWith("Translated failure title", "Translated failure body"),
    );
    expect(name).toHaveValue("Original name");
  } finally {
    log.mockRestore();
  }
});
