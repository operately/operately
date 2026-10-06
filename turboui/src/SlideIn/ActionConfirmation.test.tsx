import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ActionConfirmation } from "./ActionConfirmation";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

it("translates default actions and keeps their callbacks", async () => {
  await i18n.changeLanguage("pt-BR");
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(<ActionConfirmation isOpen onClose={onClose} onConfirm={onConfirm} />);
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
