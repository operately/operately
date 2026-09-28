/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import * as Pages from "@/components/Pages";
import * as Blobs from "@/models/blobs";
import { applyLanguage } from "@/i18n";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { ProfileEditPage } from "turboui";
import pageModule from ".";

jest.mock("axios");
jest.mock("@/i18n", () => ({ applyLanguage: jest.fn(() => Promise.resolve("en")) }));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn(), getSearchParam: () => null }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: jest.fn() }));
jest.mock("@/routes/useCompanyLoaderData", () => ({ useCompanyLoaderData: jest.fn() }));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: () => ({}) }));
jest.mock("@/models/blobs", () => ({ uploadAvatarFile: jest.fn() }));
jest.mock("@/models/people/usePossibleManagersSearch", () => ({ usePossibleManagersSearch: () => ({}) }));
jest.mock("turboui", () => ({
  ProfileEditPage: jest.fn(() => null),
  emptyContent: () => ({ type: "doc", content: [] }),
  parseContent: JSON.parse,
}));
const mockNavigate = jest.fn();
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("@/routes/paths", () => ({
  compareIds: (left: string, right: string) => left === right,
  usePaths: () => ({
    profilePath: (id: string) => `/profiles/${id}`,
    accountPath: () => "/account",
    companyManagePeoplePath: () => "/admin/manage-people",
    companyAdminPath: () => "/admin",
    homePath: () => "/home",
  }),
}));

const person = { id: "person1", fullName: "Original", title: "Engineer", avatarUrl: "/old.png" };
const Page = pageModule.Page;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <Page />
    {children}
  </QueryClientProvider>
);

function mockCompanyLoader(features: string[]) {
  jest.mocked(useCompanyLoaderData).mockReturnValue({
    company: {
      __typename: "company",
      id: "company1",
      name: "Company",
      setupCompleted: true,
      enabledExperimentalFeatures: features,
    },
    canAddProject: false,
    canAddGoal: false,
    siteMessages: [],
    billingAccessState: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(useMe).mockReturnValue(person as ReturnType<typeof useMe>);
  mockCompanyLoader([]);
  jest.mocked(axios.get).mockResolvedValue({ data: { person } });
  jest.mocked(axios.post).mockResolvedValue({ data: { person } });
});
afterEach(() => queryClient.clear());

async function mountPage() {
  const inputs = await pageModule.loader({ params: { id: person.id }, request: { url: "http://localhost/edit" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  renderHook(() => null, { initialProps: undefined, wrapper });
}

function props(): ProfileEditPage.Props {
  const value = jest.mocked(ProfileEditPage).mock.calls.at(-1)?.[0];
  if (!value) throw new Error("Profile edit page has not rendered");
  return value;
}

it.each([true, false])("saves the profile and returns to the correct page (self: %s)", async (self) => {
  if (!self) jest.mocked(useMe).mockReturnValue({ ...person, id: "admin1" } as ReturnType<typeof useMe>);
  await mountPage();
  act(() => {
    props().onFullNameChange(" Updated ");
    props().onManagerChange({ id: "manager2", fullName: "Manager", avatarUrl: null });
    props().onTimeFormatChange("hour_24");
  });
  await act(() => props().onSubmit());
  const payload = jest.mocked(axios.post).mock.calls[0]?.[1];
  expect(payload).toMatchObject({ id: person.id, full_name: "Updated", manager_id: "manager2" });
  if (self) {
    expect(payload).toMatchObject({
      description: JSON.stringify({ type: "doc", content: [] }),
      time_format: "hour_24",
    });
  } else {
    expect(payload).not.toHaveProperty("description");
    expect(payload).not.toHaveProperty("time_format");
  }
  expect(mockNavigate).toHaveBeenCalledWith(self ? "/account" : "/admin/manage-people");
  expect(props().isSubmitting).toBe(false);
});

it("hides the language selector and does not persist language when i18n is off", async () => {
  await mountPage();
  expect(props().showLanguageSelector).toBe(false);
  await act(() => props().onSubmit());
  expect(jest.mocked(axios.post).mock.calls[0]?.[1]).not.toHaveProperty("language");
  expect(applyLanguage).not.toHaveBeenCalled();
});

it("hides the language selector and does not persist language when editing someone else", async () => {
  jest.mocked(useMe).mockReturnValue({ ...person, id: "admin1" } as ReturnType<typeof useMe>);
  mockCompanyLoader(["i18n"]);
  await mountPage();
  expect(props().showLanguageSelector).toBe(false);
  await act(() => props().onSubmit());
  expect(jest.mocked(axios.post).mock.calls[0]?.[1]).not.toHaveProperty("language");
  expect(applyLanguage).not.toHaveBeenCalled();
});

it.each(["en", "pt-BR"] as const)("shows the language selector and persists %s when i18n is on", async (language) => {
  mockCompanyLoader(["i18n"]);
  await mountPage();
  expect(props().showLanguageSelector).toBe(true);
  act(() => props().onLanguageChange?.(language));
  await act(() => props().onSubmit());
  expect(jest.mocked(axios.post).mock.calls[0]?.[1]).toMatchObject({ language });
  expect(applyLanguage).toHaveBeenCalledWith(language);
});

it("navigates after a successful save even if applying language fails", async () => {
  mockCompanyLoader(["i18n"]);
  jest.mocked(applyLanguage).mockRejectedValue(new Error("Failed to apply language"));
  await mountPage();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(() => props().onSubmit());
    expect(applyLanguage).toHaveBeenCalledWith("en");
    expect(mockNavigate).toHaveBeenCalledWith("/account");
    expect(props().isSubmitting).toBe(false);
  } finally {
    log.mockRestore();
  }
});

it("keeps the draft and stays on the form after a failed save", async () => {
  await mountPage();
  act(() => props().onFullNameChange("Unsaved"));
  jest.mocked(axios.post).mockRejectedValue(new Error("Failed"));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(() => props().onSubmit());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(props().fullName).toBe("Unsaved");
    expect(props().isSubmitting).toBe(false);
  } finally {
    log.mockRestore();
  }
});

it("uploads and removes the avatar without overwriting unsaved form fields", async () => {
  await mountPage();
  act(() => props().onFullNameChange("Unsaved"));
  jest.mocked(Blobs.uploadAvatarFile).mockResolvedValue({ id: "blob1", url: "/new.png" });
  jest.mocked(axios.post).mockResolvedValue({ data: { person: { ...person, avatarUrl: "/new.png" } } });
  jest.mocked(axios.get).mockResolvedValue({ data: { person: { ...person, avatarUrl: "/new.png" } } });
  await act(async () => {
    await props().onAvatarUpload?.(new File(["image"], "avatar.png", { type: "image/png" }));
  });
  await waitFor(() => expect(props().person.avatarUrl).toBe("/new.png"));
  expect(axios.post).toHaveBeenLastCalledWith(
    "/api/v2/people/update_picture",
    {
      person_id: person.id,
      avatar_blob_id: "blob1",
      avatar_url: "/new.png",
    },
    expect.anything(),
  );
  expect(props().fullName).toBe("Unsaved");
  jest.mocked(axios.post).mockResolvedValue({ data: { person: { ...person, avatarUrl: null } } });
  jest.mocked(axios.get).mockResolvedValue({ data: { person: { ...person, avatarUrl: null } } });
  await act(async () => {
    await props().onAvatarRemove?.();
  });
  await waitFor(() => expect(props().person.avatarUrl).toBeNull());
  expect(axios.post).toHaveBeenLastCalledWith(
    "/api/v2/people/update_picture",
    {
      person_id: person.id,
      avatar_blob_id: null,
      avatar_url: null,
    },
    expect.anything(),
  );
  expect(props().fullName).toBe("Unsaved");
  expect(props().avatarUploading).toBe(false);
});
