import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ProjectCheckInFormPage } from "./index";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

jest.mock("../RichEditor", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { readLocalDraft } =
    jest.requireActual<typeof import("../RichEditor/localDrafts")>("../RichEditor/localDrafts");

  return {
    Editor: ({ editor }: { editor: { onUpdate: (update: { json: unknown }) => void } }) => (
      <textarea
        data-testid="rich-editor"
        onChange={(event) => editor.onUpdate({ json: JSON.parse(event.target.value) })}
      />
    ),
    Content: () => <div data-testid="rich-content" />,
    useEditor: (options: {
      content: unknown;
      localDraft?: import("../RichEditor/localDrafts").LocalDraftOptions;
      onUpdate: (update: { json: unknown }) => void;
    }) => {
      const [restored] = React.useState(() => readLocalDraft(options.localDraft, options.content));
      const editor = React.useRef({
        commands: { setContent: jest.fn() },
        getJSON: () => restored,
      });
      return {
        editor: editor.current,
        localDraftRestored: restored !== null,
        clearLocalDraft: () => undefined,
        onUpdate: options.onUpdate,
      };
    },
  };
});

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

function description(text: string) {
  return { type: "doc", content: [{ type: "paragraph", ...(text ? { content: [{ type: "text", text }] } : {}) }] };
}

function editDescription(text: string) {
  fireEvent.change(screen.getByTestId("rich-editor"), { target: { value: JSON.stringify(description(text)) } });
}

function control(testId: string) {
  const element = document.querySelector(`[data-test-id="${testId}"]`);
  if (!element) throw new Error(`Missing control: ${testId}`);
  return element;
}

function selectStatus(status = "on_track") {
  fireEvent.click(control("status-dropdown"));
  fireEvent.click(control(`status-dropdown-${status}`));
}

function requestsUnloadConfirmation() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("create-mode unload protection", () => {
  afterEach(() => localStorage.clear());

  test("protects meaningful text and stops protecting when it is cleared", () => {
    renderCreateForm();
    expect(requestsUnloadConfirmation()).toBe(false);
    editDescription("");
    expect(requestsUnloadConfirmation()).toBe(false);
    editDescription("Unsaved progress");
    expect(requestsUnloadConfirmation()).toBe(true);
    editDescription("");
    expect(requestsUnloadConfirmation()).toBe(false);
  });

  test("protects a selected status alone and removes the listener on unmount", () => {
    const { unmount } = renderCreateForm();
    selectStatus();
    expect(requestsUnloadConfirmation()).toBe(true);
    unmount();
    expect(requestsUnloadConfirmation()).toBe(false);
  });

  test("does not protect edit-mode check-ins", () => {
    const handlers = createMockRichEditorHandlers();
    const addListener = jest.spyOn(window, "addEventListener");
    render(
      <MemoryRouter>
        <ProjectCheckInFormPage
          mode="edit"
          checkIn={previousCheckIn.checkIn}
          allowFullEdit
          pageTitle={["Check-In"]}
          navigation={[]}
          cancelLink="/project"
          richTextHandlers={handlers}
          mentionedPersonLookup={handlers.mentionedPersonLookup}
          formattedTimePreferences={defaultFormattedTimePreferences}
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );
    editDescription("Edited progress");
    expect(requestsUnloadConfirmation()).toBe(false);
    expect(addListener.mock.calls.some(([type]) => type === "beforeunload")).toBe(false);
    addListener.mockRestore();
  });

  test("protects nonempty text restored by the editor", async () => {
    localStorage.setItem(
      `operately:rich-text-draft:form:${window.location.pathname}:description`,
      JSON.stringify({
        content: description("Recovered progress"),
        baseContent: null,
        updatedAt: Date.now(),
      }),
    );
    renderCreateForm();
    await waitFor(() => expect(requestsUnloadConfirmation()).toBe(true));
  });

  test("retains protection after validation fails", async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    renderCreateForm({ onSubmit });
    editDescription("Status still missing");
    fireEvent.click(control("submit"));
    await waitFor(() => expect(document.getElementById("status-error")).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(requestsUnloadConfirmation()).toBe(true);
  });

  test.each(["submit", "draft", "schedule"] as const)(
    "protects pending %s and only clears the saved values on success",
    async (action) => {
      let resolveSubmit: (success: boolean) => void = () => undefined;
      const onSubmit = jest.fn(
        (_values: ProjectCheckInFormPage.Values, _meta: ProjectCheckInFormPage.SubmitMeta) =>
          new Promise<boolean>((resolve) => {
            resolveSubmit = resolve;
          }),
      );
      renderCreateForm({ onSubmit });
      if (action === "schedule") {
        fireEvent.keyDown(control("submit-options"), { key: "ArrowDown" });
        fireEvent.click(control("schedule-for-later"));
        fireEvent.click(screen.getByTestId("date-field-next-month"));
        fireEvent.click(control("date-field-day-1"));
        fireEvent.click(control("confirm-schedule"));
        expect(requestsUnloadConfirmation()).toBe(false);
      }
      selectStatus();
      editDescription("Ready to save");
      fireEvent.click(control(action === "draft" ? "save-as-draft" : "submit"));
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0]).toEqual([expect.anything(), expect.objectContaining({ action })]);
      expect(requestsUnloadConfirmation()).toBe(true);
      await act(async () => resolveSubmit(true));
      expect(requestsUnloadConfirmation()).toBe(false);
      editDescription("Another update");
      expect(requestsUnloadConfirmation()).toBe(true);
      editDescription("Ready to save");
      expect(requestsUnloadConfirmation()).toBe(false);
      selectStatus("caution");
      expect(requestsUnloadConfirmation()).toBe(true);
    },
  );

  test("a successful response does not mark changes made during the request as saved", async () => {
    let resolveSubmit: (success: boolean) => void = () => undefined;
    renderCreateForm({
      onSubmit: () =>
        new Promise<boolean>((resolve) => {
          resolveSubmit = resolve;
        }),
    });
    selectStatus();
    editDescription("Submitted progress");
    fireEvent.click(control("submit"));
    editDescription("More progress while saving");
    await act(async () => resolveSubmit(true));
    expect(requestsUnloadConfirmation()).toBe(true);
    editDescription("Submitted progress");
    expect(requestsUnloadConfirmation()).toBe(false);
  });

  test.each(["false", "rejected"])("retains protection after a %s submission", async (result) => {
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const onSubmit = jest.fn(() =>
      result === "false" ? Promise.resolve(false) : Promise.reject(new Error("Request failed")),
    );
    renderCreateForm({ onSubmit });
    selectStatus();
    editDescription("Still unsaved");
    fireEvent.click(control("submit"));
    await waitFor(() => expect(document.querySelector('[data-test-id="submit"]')).not.toBeDisabled());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(requestsUnloadConfirmation()).toBe(true);
    errorLog.mockRestore();
  });
});
