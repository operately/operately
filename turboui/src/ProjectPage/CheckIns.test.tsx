import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import { CheckIns } from "./CheckIns";
import type { ProjectPage } from ".";
import { generatePermissions } from "../utils/storybook/permissions";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

it("uses substituted project check-in and error copy", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    { "Post check-in": "Expanded post project check-in", "Unable to load check-ins.": "Translated check-in error" },
    true,
    true,
  );
  render(
    <MemoryRouter>
      <CheckIns {...props} checkInsError />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Expanded post project check-in" })).toHaveAttribute("href", "/new");
  expect(screen.getByRole("alert")).toHaveTextContent("Translated check-in error");
});

jest.mock("./CheckInOverdueCallout", () => ({ CheckInOverdueCallout: () => null }));
const props = {
  checkIns: [] as ProjectPage.State["checkIns"],
  permissions: generatePermissions(true),
  state: "active",
  newCheckInLink: "/new",
} as ProjectPage.State;

it("keeps the heading and permitted posting action visible while loading", () => {
  render(
    <MemoryRouter>
      <CheckIns {...props} checkInsLoading />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: "Check-Ins" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Post check-in" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
});

it("removes the skeleton after loading an empty list", () => {
  const { rerender } = render(
    <MemoryRouter>
      <CheckIns {...props} checkInsLoading />
    </MemoryRouter>,
  );
  rerender(
    <MemoryRouter>
      <CheckIns {...props} />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
