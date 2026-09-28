import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CompletedMilestonesSection } from "./CompletedMilestonesSection";
import type { MilestoneWithStats } from "../types";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

function milestones(count: number): MilestoneWithStats[] {
  return Array.from({ length: count }, (_, index) => ({
    milestone: { id: String(index), name: "User milestone", dueDate: null, status: "done" },
    tasks: [],
    stats: { total: 0, done: 0, canceled: 0, pending: 0, inProgress: 0 },
  }));
}

test.each([0, 1, 3])("falls back to English for %i completed milestones in Portuguese", async (count) => {
  await i18n.changeLanguage("pt-BR");
  render(
    <CompletedMilestonesSection
      milestones={milestones(count)}
      formattedTimePreferences={defaultFormattedTimePreferences}
    />,
  );
  expect(screen.getByRole("button")).toHaveAccessibleName(`${count} completed milestone${count === 1 ? "" : "s"}`);
});

test.each([0, 1, 3])("uses substituted plural forms for %i completed milestones", (count) => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "1 completed milestone_one": "One translated milestone",
      "1 completed milestone_other": "{{count}} translated milestones",
    },
    true,
    true,
  );
  render(
    <CompletedMilestonesSection
      milestones={milestones(count)}
      formattedTimePreferences={defaultFormattedTimePreferences}
    />,
  );
  expect(screen.getByRole("button")).toHaveAccessibleName(
    count === 1 ? "One translated milestone" : `${count} translated milestones`,
  );
});
