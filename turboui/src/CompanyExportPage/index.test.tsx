import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import { i18nOptions } from "../i18nOptions";
import { CompanyExportPage } from ".";

it.each([
  ["en", "Writing Package", "Start export"],
  ["en", "Translated package step", "Translated export action"],
  ["pt-BR", "Writing Package", "Start export"],
])("looks up export progress copy and falls back to English: %s / %s", async (language, step, action) => {
  const i18n = createInstance();
  await i18n.init({
    ...i18nOptions,
    lng: language,
    resources: {
      en: { translation: { "Writing Package": step, "Start export": action } },
      "pt-BR": { translation: {} },
    },
  });
  const onStartExport = jest.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <CompanyExportPage
          runs={[
            {
              id: "export-1",
              status: "running",
              currentStep: "writing_package",
              percentage: 70,
              insertedAt: "2026-09-25T12:00:00Z",
            },
          ]}
          starting={false}
          downloading={null}
          backPath="/admin"
          onStartExport={onStartExport}
          onDownload={() => {}}
          formattedTimePreferences={{}}
        />
      </MemoryRouter>
    </I18nextProvider>,
  );
  expect(screen.getByText(step)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: action }));
  expect(onStartExport).toHaveBeenCalledTimes(1);
});
