import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { i18n, setupTestCatalog } from "../../../test/i18n";
import { WorkMapNavigation } from "./WorkMapNavigation";

setupTestCatalog();

test("uses substituted catalog copy for the view toggle group name", () => {
  i18n.addResourceBundle("en", "translation", { "Work map view": "Translated work map view" }, true, true);

  render(
    <MemoryRouter>
      <WorkMapNavigation tabsState={{ active: "projects", tabs: [] }} timelineAvailable />
    </MemoryRouter>,
  );

  expect(screen.getByRole("group", { name: "Translated work map view" })).toBeInTheDocument();
});
