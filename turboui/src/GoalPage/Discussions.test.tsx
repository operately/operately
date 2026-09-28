import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { Discussions } from "./Discussions";
import type { GoalPage } from ".";
import { generateGoalPermissions } from "../utils/storybook/permissions";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

test("looks up discussion empty and closed states and preserves posting permissions", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "No discussions yet": "Translated empty discussions",
      "This goal is closed and has no discussions.": "Translated closed discussions",
    },
    true,
    true,
  );
  const props: Partial<GoalPage.State> = {
    discussions: [],
    state: "active",
    permissions: generateGoalPermissions(true),
    newDiscussionLink: "/new-discussion",
  };
  const { rerender } = render(
    <MemoryRouter>
      <Discussions {...(props as GoalPage.State)} />
    </MemoryRouter>,
  );
  expect(screen.getByText("Translated empty discussions")).toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/new-discussion");
  rerender(
    <MemoryRouter>
      <Discussions {...(props as GoalPage.State)} state="closed" />
    </MemoryRouter>,
  );
  expect(screen.getByText("Translated closed discussions")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
