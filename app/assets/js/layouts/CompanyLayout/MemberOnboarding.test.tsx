/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { MemberOnboarding } from "./MemberOnboarding";
import { TitleSetupPrompt } from "turboui";

jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: jest.fn() }));
jest.mock("@/models/people", () => ({ useUpdateProfile: () => ({ mutateAsync: mockUpdateProfile }) }));
jest.mock("turboui", () => ({ TitleSetupPrompt: jest.fn(() => null) }));

const mockUpdateProfile = jest.fn().mockResolvedValue({});
const person = {
  id: "member1",
  titleSetupPending: true,
  type: "human",
  permissions: { canEditProfile: true },
} as NonNullable<ReturnType<typeof useMe>>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useMe).mockReturnValue(person);
});

function renderPrompt() {
  renderToStaticMarkup(<MemberOnboarding />);
  return jest.mocked(TitleSetupPrompt).mock.calls.at(-1)?.[0];
}

it.each([
  null,
  { ...person, titleSetupPending: false },
  { ...person, type: "guest" },
  { ...person, permissions: { canEditProfile: false } },
])("does not prompt ineligible members: %j", (me) => {
  jest.mocked(useMe).mockReturnValue(me as ReturnType<typeof useMe>);
  expect(renderPrompt()).toBeUndefined();
});

it("saves the title and clears setup for the current membership", async () => {
  const props = renderPrompt();
  expect(props).toBeDefined();
  await props?.onSave("Designer");
  expect(mockUpdateProfile).toHaveBeenCalledWith({ id: "member1", title: "Designer", titleSetupPending: false });
});

it("skips without changing the title", async () => {
  await renderPrompt()?.onSkip();
  expect(mockUpdateProfile).toHaveBeenCalledWith({ id: "member1", titleSetupPending: false });
});

it("stops prompting once refreshed membership data is complete", () => {
  expect(renderPrompt()).toBeDefined();
  jest.mocked(TitleSetupPrompt).mockClear();
  jest.mocked(useMe).mockReturnValue({ ...person, titleSetupPending: false });
  expect(renderPrompt()).toBeUndefined();
});

it("uses the new membership when switching companies", async () => {
  renderPrompt();
  jest.mocked(useMe).mockReturnValue({ ...person, id: "member2" });
  await renderPrompt()?.onSkip();
  expect(mockUpdateProfile).toHaveBeenCalledWith({ id: "member2", titleSetupPending: false });
});
