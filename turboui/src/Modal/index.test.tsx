import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { Modal } from ".";

it.each(["Close", "Translated close"])("uses the catalog for the close button's accessible name: %s", async (label) => {
  const i18n = createInstance();
  await i18n.init({ lng: "en", resources: { en: { translation: { Close: label } } } });
  const onClose = jest.fn();

  render(
    <I18nextProvider i18n={i18n}>
      <Modal isOpen onClose={onClose} title="Create Task">
        Task form
      </Modal>
    </I18nextProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: label }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
