import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ProjectCheckInFormPage } from "./index";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

jest.mock("../RichEditor", () => ({
  Editor: () => <div data-testid="rich-editor" />,
  Content: () => <div data-testid="rich-content" />,
  useEditor: () => ({
    editor: {
      commands: { setContent: jest.fn() },
      getJSON: () => null,
    },
    localDraftRestored: false,
    clearLocalDraft: () => undefined,
  }),
}));

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
        pageTitle={["Check-In", "Apollo"]}
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
    expect(screen.queryByTestId("rich-content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Show previous check-in"));
    expect(screen.getByTestId("rich-content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View original" })).toHaveAttribute("href", previousCheckIn.link);

    fireEvent.click(screen.getByText("Hide previous check-in"));
    expect(screen.queryByTestId("rich-content")).not.toBeInTheDocument();
  });
});
