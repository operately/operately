import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import { CheckIns } from "./CheckIns";
import type { ProjectPage } from ".";
import { generatePermissions } from "../utils/storybook/permissions";

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
