import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import { StatusBanner } from "./StatusBanner";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { i18n, setupTestCatalog } from "../../test/i18n";

describe("closed project banner translations", () => {
  afterEach(cleanup);
  setupTestCatalog();

  it("keeps the retrospective link text and destination in a reordered translation", async () => {
    i18n.addResourceBundle(
      "pt-BR",
      "translation",
      {
        "Read the <resource>retrospective</resource>.": "<resource>Retrospectiva traduzida</resource>: leia aqui.",
      },
      true,
      true,
    );
    await i18n.changeLanguage("pt-BR");
    render(
      <MemoryRouter>
        <StatusBanner
          state="closed"
          retrospectiveLink="/retrospectives/1"
          formattedTimePreferences={defaultFormattedTimePreferences}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Retrospectiva traduzida" })).toHaveAttribute("href", "/retrospectives/1");
    expect(screen.getByText(/leia aqui/)).toBeInTheDocument();
  });
});
