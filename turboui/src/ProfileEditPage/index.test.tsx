import React from "react";
import { configure, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import "@testing-library/jest-dom";
import "../i18n";

import { ProfileEditPage } from "./index";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

jest.mock("../RichEditor", () => ({
  Editor: () => <div />,
  useEditor: () => ({ editor: null, localDraftRestored: false }),
}));

configure({ testIdAttribute: "data-test-id" });

function renderPage(overrides: Partial<ProfileEditPage.Props> = {}) {
  const props: ProfileEditPage.Props = {
    person: { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null, title: "Engineer" },
    fullName: "Ada Lovelace",
    title: "Engineer",
    aboutMe: null,
    timezone: "America/New_York",
    timeFormat: "automatic",
    language: "en",
    manager: null,
    onFullNameChange: jest.fn(),
    onTitleChange: jest.fn(),
    onAboutMeChange: jest.fn(),
    onTimezoneChange: jest.fn(),
    onTimeFormatChange: jest.fn(),
    onLanguageChange: jest.fn(),
    onManagerChange: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    managerSearch: { people: [], onSearch: jest.fn().mockResolvedValue(undefined) },
    richTextHandlers: createMockRichEditorHandlers(),
    timezones: [{ value: "America/New_York", label: "Eastern Time (ET)" }],
    isCurrentUser: true,
    showLanguageSelector: true,
    fromLocation: null,
    companyAdminPath: "/admin",
    managePeoplePath: "/admin/people",
    homePath: "/",
    ...overrides,
  };

  return render(
    <MemoryRouter>
      <ProfileEditPage {...props} />
    </MemoryRouter>,
  );
}

test("associates the language label with the language dropdown", () => {
  renderPage();

  const trigger = screen.getByTestId("language");

  expect(trigger).toHaveAccessibleName("Language");
  expect(trigger).toHaveTextContent("English");
});
