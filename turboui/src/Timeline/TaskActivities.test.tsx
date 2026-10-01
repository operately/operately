import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import { TaskActivityItem } from "./TaskActivities";
import type { TaskCreationActivity } from "./types";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { i18n, setupTestCatalog } from "../../test/i18n";

describe("task timeline translations", () => {
  afterEach(cleanup);
  setupTestCatalog();

  const activity: TaskCreationActivity = {
    id: "activity-1",
    type: "task_adding",
    author: { id: "author-1", fullName: "<Admin> & Team", avatarUrl: null, profileLink: "/people/author-1" },
    taskName: "Ship <QA> & Sales",
    page: "milestone",
    insertedAt: "2026-09-30T12:00:00Z",
  };

  function renderActivity(value = activity) {
    return render(
      <MemoryRouter>
        <TaskActivityItem activity={value} formattedTimePreferences={defaultFormattedTimePreferences} />
      </MemoryRouter>,
    );
  }

  it("lets the catalog reorder the author and keeps names literal when switching language", async () => {
    i18n.addResourceBundle(
      "pt-BR",
      "translation",
      {
        "<author/> created {{taskName}}": "Criada: {{taskName}} por <author/>",
      },
      true,
      true,
    );
    const { container } = renderActivity();
    expect(container).toHaveTextContent('created "Ship <QA> & Sales"');
    await act(() => i18n.changeLanguage("pt-BR"));
    expect(container).toHaveTextContent('Criada: "Ship <QA> & Sales" por');
    expect(screen.getByRole("link")).toHaveAttribute("href", "/people/author-1");
    expect(screen.getByRole("link").textContent).toContain("<Admin>");
    expect(container.querySelector("qa, admin")).toBeNull();
  });

  it("falls back to English for the complete sentence", async () => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await i18n.changeLanguage("pt-BR");
    const { container } = renderActivity({ ...activity, page: "task" });
    expect(container).toHaveTextContent("created this task");
  });
});
