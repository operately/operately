import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import React from "react";
import { I18nextProvider } from "react-i18next";

import { ConfirmDialog } from "./index";

it.each([
  ["Confirm", "Cancel"],
  ["Confirmar", "Cancelar"],
])("uses catalog copy for default actions: %s / %s", async (confirm, cancel) => {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    resources: { en: { translation: { Confirm: confirm, Cancel: cancel } } },
  });
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  render(
    <I18nextProvider i18n={i18n}>
      <ConfirmDialog isOpen onConfirm={onConfirm} onCancel={onCancel} title="Delete" message="Delete this item?" />
    </I18nextProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: cancel }));
  expect(onCancel).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: confirm }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
