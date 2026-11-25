import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ProjectCheckInFormPage } from "./index";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

const previousCheckIn: ProjectCheckInFormPage.PreviousCheckIn = {
  link: "/projects/project-1/check-ins/check-in-1",
  checkIn: {
    __typename: "project_check_in",
    id: "check-in-1",
    status: "on_track",
    state: "published",
    insertedAt: "2024-06-01T12:00:00.000Z",
    updatedAt: "2024-06-01T12:00:00.000Z",
    publishedAt: "2024-06-01T12:00:00.000Z",
    description: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Shipped the onboarding flow." }] }],
    }),
    author: null,
    project: null,
    space: null,
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
};

function renderCreateForm(overrides: Partial<ProjectCheckInFormPage.CreateProps> = {}) {
  const richTextHandlers = createMockRichEditorHandlers();

  return render(
    <MemoryRouter>
      <ProjectCheckInFormPage
        mode="create"
        pageTitle={["Check-in", "Apollo"]}
        navigation={[]}
        cancelLink="/projects/project-1"
        richTextHandlers={richTextHandlers}
        mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
        formattedTimePreferences={defaultFormattedTimePreferences}
        subscriptions={{
          subscribers: [],
          selectedSubscribers: [],
          onSelectedSubscribersChange: jest.fn(),
          subscriptionType: SubscribersSelector.SubscriptionOption.ALL,
          onSubscriptionTypeChange: jest.fn(),
          alwaysNotify: [],
          allSubscribersLabel: "Everyone who is contributing to Apollo",
        }}
        onSubmit={jest.fn().mockResolvedValue(true)}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe("ProjectCheckInFormPage", () => {
  test("uses a verb in the create heading", () => {
    renderCreateForm();
    expect(screen.getByText("Let's check in")).toBeInTheDocument();
  });

  test("uses a lowercase noun in the edit heading", () => {
    const richTextHandlers = createMockRichEditorHandlers();
    render(
      <MemoryRouter>
        <ProjectCheckInFormPage
          mode="edit"
          pageTitle={["Edit project check-in", "Apollo"]}
          navigation={[]}
          cancelLink="/projects/project-1"
          richTextHandlers={richTextHandlers}
          mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
          formattedTimePreferences={defaultFormattedTimePreferences}
          checkIn={previousCheckIn.checkIn}
          allowFullEdit
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/^Editing the check-in from/)).toBeInTheDocument();
  });

  test.each([
    ["null", { previousCheckIn: null }],
    ["omitted", {}],
  ] satisfies [string, Partial<ProjectCheckInFormPage.CreateProps>][])(
    "asks about current progress when previousCheckIn is %s",
    (_state, overrides) => {
      renderCreateForm(overrides);

      expect(screen.getByText("2. What is the current progress on the project?")).toBeInTheDocument();
      expect(screen.queryByText("2. What's new since the last check-in?")).not.toBeInTheDocument();
      expect(screen.queryByText("Show previous check-in")).not.toBeInTheDocument();
    },
  );

  test("asks about changes and toggles the preview when a previous check-in exists", () => {
    renderCreateForm({ previousCheckIn });

    expect(screen.getByText("2. What's new since the last check-in?")).toBeInTheDocument();
    expect(screen.queryByText("2. What is the current progress on the project?")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View original" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Show previous check-in"));
    expect(screen.getByRole("link", { name: "View original" })).toHaveAttribute("href", previousCheckIn.link);

    fireEvent.click(screen.getByText("Hide previous check-in"));
    expect(screen.queryByRole("link", { name: "View original" })).not.toBeInTheDocument();
  });
});

function control(testId: string) {
  const element = document.querySelector(`[data-test-id="${testId}"]`);
  if (!element) throw new Error(`Missing control: ${testId}`);
  return element;
}

function editDescription(text: string) {
  const editor = document.querySelector('[contenteditable="true"]');
  if (!editor) throw new Error("Editor did not mount");
  fireEvent.paste(editor, {
    clipboardData: { getData: (type: string) => (type === "text/plain" ? text : ""), items: [], files: [] },
  });
}

function selectStatus() {
  fireEvent.click(control("status-dropdown"));
  fireEvent.click(control("status-dropdown-on_track"));
}

function currentEditorText() {
  return document.querySelector('[contenteditable="true"]')?.textContent;
}

describe("local check-in content recovery", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  test("restores unsaved text on reopening and allows further edits", async () => {
    const first = renderCreateForm();
    editDescription("Unsaved progress");
    first.unmount();
    const second = renderCreateForm();
    expect(currentEditorText()).toContain("Unsaved progress");
    editDescription(" More progress");
    selectStatus();
    expect(currentEditorText()).toContain("More progress");
    second.unmount();
    const onSubmit = jest.fn().mockResolvedValue(true);
    renderCreateForm({ onSubmit });
    selectStatus();
    fireEvent.click(control("submit"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(JSON.stringify(onSubmit.mock.calls[0][0].description)).toContain("More progress");
  });

  test.each(["false", "rejected"])("retains the local draft after a %s submission", async (result) => {
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const onSubmit = jest.fn(() =>
      result === "false" ? Promise.resolve(false) : Promise.reject(new Error("Request failed")),
    );
    const first = renderCreateForm({ onSubmit });
    editDescription("Still unsaved");
    selectStatus();
    fireEvent.click(control("submit"));
    await waitFor(() => expect(control("submit")).not.toBeDisabled());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    first.unmount();
    renderCreateForm();
    expect(currentEditorText()).toContain("Still unsaved");
    errorLog.mockRestore();
  });

  test.each(["submit", "draft", "schedule"] as const)("clears the local draft after successful %s", async (action) => {
    const first = renderCreateForm();
    editDescription("Saved progress");
    selectStatus();
    if (action === "schedule") {
      fireEvent.keyDown(control("submit-options"), { key: "ArrowDown" });
      fireEvent.click(control("schedule-for-later"));
      fireEvent.click(screen.getByTestId("date-field-next-month"));
      fireEvent.click(control("date-field-day-1"));
      fireEvent.click(control("confirm-schedule"));
    }
    fireEvent.click(control(action === "draft" ? "save-as-draft" : "submit"));
    await waitFor(() => expect(control("submit")).not.toBeDisabled());
    first.unmount();
    renderCreateForm();
    expect(currentEditorText()).toBe("");
  });
});
