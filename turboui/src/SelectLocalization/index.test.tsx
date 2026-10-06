import "@testing-library/jest-dom";
import React from "react";
import Select from "react-select";
import { fireEvent, render, screen } from "@testing-library/react";
import { i18n, setupTestCatalog } from "../../test/i18n";
import { useSelectLocalization } from ".";

setupTestCatalog();

function Control({
  loading = false,
  options = [],
}: {
  loading?: boolean;
  options?: { value: string; label: string }[];
}) {
  const localization = useSelectLocalization<{ value: string; label: string }>();
  return (
    <Select
      {...localization}
      blurInputOnSelect={false}
      inputId="localized-select"
      isLoading={loading}
      options={options}
    />
  );
}

test.each([
  ["en", "Select...", "No options", "Loading..."],
  ["pt-BR", "Selecione...", "Nenhuma opção", "Carregando..."],
  ["fr", "Select...", "No options", "Loading..."],
])("localizes empty/loading states with fallback in %s", async (language, placeholder, empty, loading) => {
  await i18n.changeLanguage(language);
  const { rerender } = render(<Control />);
  expect(screen.getByText(placeholder)).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
  expect(screen.getByText(empty)).toBeInTheDocument();
  rerender(<Control loading />);
  expect(screen.getByText(loading)).toBeInTheDocument();
});

test("announces search results and preserves literal option names in Portuguese", async () => {
  await i18n.changeLanguage("pt-BR");
  const { container } = render(<Control options={[{ value: "1", label: "Ana <team> & Co" }]} />);
  fireEvent.focus(screen.getByRole("combobox"));
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
  expect(container.querySelector('[role="log"]')).toHaveTextContent("1 resultado disponível.");
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
  expect(container.querySelector('[role="log"]')).toHaveTextContent("Opção Ana <team> & Co selecionada.");
});
