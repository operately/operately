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
    manager: null,
    onFullNameChange: jest.fn(),
    onTitleChange: jest.fn(),
    onAboutMeChange: jest.fn(),
    onManagerChange: jest.fn(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    managerSearch: { people: [], onSearch: jest.fn().mockResolvedValue(undefined) },
    richTextHandlers: createMockRichEditorHandlers(),
    isCurrentUser: true,
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

test.each([true, false])("keeps personal preferences out of profile editing (self: %s)", (isCurrentUser) => {
  renderPage({ isCurrentUser });
  expect(screen.getByTestId("name")).toBeInTheDocument();
  expect(screen.getByTestId("title")).toBeInTheDocument();
  expect(screen.getByTestId("manager")).toBeInTheDocument();
  for (const field of ["language", "timezone", "time-format"]) {
    expect(screen.queryByTestId(field)).not.toBeInTheDocument();
  }
});
