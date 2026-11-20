/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import i18n, { applyLanguage } from "@/i18n";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { CompanyAdminAddPeoplePage, showErrorToast } from "turboui";
import pageModule from ".";

jest.mock("axios");
jest.mock("./loader", () => ({
  loader: jest.fn(),
  useLoadedData: () => ({ company: { id: "company1", name: "Company" }, ownerIds: [] }),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "admin1" }) }));
jest.mock("turboui", () => ({ CompanyAdminAddPeoplePage: jest.fn(() => null), showErrorToast: jest.fn() }));
let mockMemberType = "outside_collaborator";
jest.mock("react-router", () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams({ memberType: mockMemberType })],
}));
jest.mock("@/routes/paths", () => ({
  includesId: (ids: string[], id: string) => ids.includes(id),
  usePaths: () => ({
    companyAdminPath: () => "/admin",
    companyManagePeoplePath: () => "/admin/manage-people",
  }),
}));

const Page = pageModule.Page;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <Page />
    {children}
  </QueryClientProvider>
);

function props(): CompanyAdminAddPeoplePage.Props {
  const value = jest.mocked(CompanyAdminAddPeoplePage).mock.calls.at(-1)?.[0];
  if (!value) throw new Error("Add people page has not rendered");
  return value;
}

function fillForm() {
  act(() => {
    props().onFormChange("fullName", "Person");
    props().onFormChange("email", "person@example.com");
    props().onFormChange("title", "Engineer");
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  mockMemberType = "outside_collaborator";
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.post).mockResolvedValue({ data: { person_id: "person1", new_account: false } });
});
afterEach(async () => {
  queryClient.clear();
  await act(async () => {
    await applyLanguage("en");
  });
});

it("fetches current resource options for each collaborator even when the lists are cached", async () => {
  queryClient.setQueryData(Api.spaces.listQueryKey({}), { spaces: [{ id: "space1", name: "Old space" }] });
  queryClient.setQueryData(Api.goals.listQueryKey({ includeSpace: true }), { goals: [] });
  queryClient.setQueryData(Api.projects.listQueryKey({}), { projects: [] });
  renderHook(() => null, { initialProps: undefined, wrapper });

  for (const version of [1, 2]) {
    const spaces = [{ id: "space1", name: `Renamed space ${version}` }];
    const goals = [{ id: `goal${version}`, name: `New goal ${version}` }];
    const projects = [{ id: `project${version}`, name: `New project ${version}` }];
    jest.mocked(axios.get).mockImplementation(async (url) => {
      if (url.endsWith("/spaces/list")) return { data: { spaces } };
      if (url.endsWith("/goals/list")) return { data: { goals } };
      if (url.endsWith("/projects/list")) return { data: { projects } };
      throw new Error(`Unexpected request: ${url}`);
    });
    fillForm();
    await act(() => props().onSubmit());
    expect(props().state.state).toBe("added");
    expect(props().spaces).toEqual(spaces);
    expect(props().goals).toEqual(goals);
    expect(props().projects).toEqual(projects);
    expect(queryClient.getQueryData(Api.spaces.listQueryKey({}))).toEqual({ spaces });
    expect(queryClient.getQueryData(Api.goals.listQueryKey({ includeSpace: true }))).toEqual({ goals });
    expect(queryClient.getQueryData(Api.projects.listQueryKey({}))).toEqual({ projects });
    expect(axios.get).toHaveBeenCalledTimes(version * 3);
    const inviteAnother = props().onInviteAnother;
    if (!inviteAnother) throw new Error("Invite another action is unavailable");
    act(() => inviteAnother());
  }
});

it("does not fetch resource options when adding a team member", async () => {
  mockMemberType = "team_member";
  renderHook(() => null, { initialProps: undefined, wrapper });
  fillForm();
  await act(() => props().onSubmit());
  expect(props().state.state).toBe("added");
  expect(axios.get).not.toHaveBeenCalled();
});

describe.each([
  ["team_member", "create_member"],
  ["outside_collaborator", "invite_guest"],
])("%s invitation", (memberType, endpoint) => {
  it("shows an inline error for an overlong name and submits after correction", async () => {
    mockMemberType = memberType;
    jest.mocked(axios.get).mockResolvedValue({ data: { spaces: [], goals: [], projects: [] } });
    renderHook(() => null, { initialProps: undefined, wrapper });
    fillForm();
    const fullName = "a".repeat(256);
    act(() => props().onFormChange("fullName", fullName));

    await act(() => props().onSubmit());

    expect(props().formErrors).toEqual({ fullName: "Must be at most 255 characters long" });
    expect(props().formValues).toEqual({ fullName, email: "person@example.com", title: "Engineer" });
    expect(props().state.state).toBe("form");
    expect(axios.post).not.toHaveBeenCalled();
    expect(showErrorToast).not.toHaveBeenCalled();

    // Count Unicode characters as PostgreSQL does, and ignore surrounding whitespace.
    const correctedName = "𠮷".repeat(255);
    act(() => props().onFormChange("fullName", `  ${correctedName}  `));
    await act(() => props().onSubmit());

    expect(props().formErrors).toEqual({});
    expect(props().state.state).toBe("added");
    expect(axios.post).toHaveBeenCalledWith(
      `/api/v2/companies/${endpoint}`,
      { full_name: correctedName, email: "person@example.com", title: "Engineer" },
      expect.anything(),
    );
  });

  it.each([
    ["untouched", undefined, ""],
    ["whitespace-only", "   ", ""],
    ["supplied", "  Engineer  ", "Engineer"],
  ])("submits with title %s and shows the invitation result", async (_description, title, expectedTitle) => {
    mockMemberType = memberType;
    jest.mocked(axios.post).mockResolvedValue({
      data: { person_id: "person1", new_account: true, invite_link: { token: "invite-token" } },
    });
    jest.mocked(axios.get).mockImplementation(async (url) => {
      if (url.endsWith("/spaces/list")) return { data: { spaces: [] } };
      if (url.endsWith("/goals/list")) return { data: { goals: [] } };
      if (url.endsWith("/projects/list")) return { data: { projects: [] } };
      throw new Error(`Unexpected request: ${url}`);
    });
    renderHook(() => null, { initialProps: undefined, wrapper });
    act(() => {
      props().onFormChange("fullName", "  Person  ");
      props().onFormChange("email", "  person@example.com  ");
      if (title !== undefined) props().onFormChange("title", title);
    });

    await act(() => props().onSubmit());

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      `/api/v2/companies/${endpoint}`,
      { full_name: "Person", email: "person@example.com", title: expectedTitle },
      expect.anything(),
    );
    expect(props().formErrors).toEqual({});
    expect(props().state).toEqual({
      state: "invited",
      fullName: "  Person  ",
      personId: "person1",
      inviteLink: expect.stringContaining("/join?token=invite-token"),
    });
    expect(props().isSubmitting).toBe(false);
  });
});

it.each([
  ["fullName", ""],
  ["fullName", "   "],
  ["fullName", "Al"],
  ["email", ""],
  ["email", "   "],
  ["email", "invalid-email"],
  ["email", "person@example"],
] as const)("prevents submission when %s is invalid (%s)", async (field, value) => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  fillForm();
  act(() => props().onFormChange(field, value));

  await act(() => props().onSubmit());

  expect(axios.post).not.toHaveBeenCalled();
  expect(Object.keys(props().formErrors ?? {})).toEqual([field]);
  expect(props().state.state).toBe("form");
});

it("shows both client errors and invites after correction without losing entries", async () => {
  mockMemberType = "team_member";
  renderHook(() => null, { initialProps: undefined, wrapper });
  act(() => {
    props().onFormChange("fullName", "   ");
    props().onFormChange("email", "person@example");
    props().onFormChange("title", "Engineer");
  });

  await act(() => props().onSubmit());
  expect(props().formErrors).toEqual({
    fullName: "Name is required",
    email: "Enter a valid email address",
  });
  expect(props().formValues).toEqual({ fullName: "   ", email: "person@example", title: "Engineer" });
  expect(axios.post).not.toHaveBeenCalled();

  act(() => {
    props().onFormChange("fullName", "Person");
    props().onFormChange("email", "person@example.com");
  });
  await act(() => props().onSubmit());

  expect(props().formErrors).toEqual({});
  expect(props().isSubmitting).toBe(false);
  expect(props().state.state).toBe("added");
  expect(axios.post).toHaveBeenCalledTimes(1);
});

it("updates navigation when the language changes while mounted", async () => {
  i18n.addResourceBundle(
    "pt-BR",
    "translation",
    {
      "Company Administration": "Administração da empresa",
      "Manage Team Members": "Gerenciar membros",
    },
    true,
    true,
  );
  renderHook(() => null, { initialProps: undefined, wrapper });
  expect(props().navigationItems[0]?.label).toBe("Company Administration");

  await act(async () => {
    await applyLanguage("pt-BR");
  });

  expect(props().navigationItems[0]?.label).toBe("Administração da empresa");
  expect(props().navigationItems[1]?.label).toBe("Gerenciar membros");
});

it.each([
  ["team_member", "full_name", "fullName"],
  ["outside_collaborator", "email", "email"],
] as const)("places a localized %s %s validation error beside %s", async (memberType, serverField, formField) => {
  mockMemberType = memberType;
  const message = "Mensagem localizada do servidor";
  jest.mocked(axios.post).mockRejectedValue({ response: { data: { message, details: { field: serverField } } } });
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    renderHook(() => null, { initialProps: undefined, wrapper });
    fillForm();
    await act(() => props().onSubmit());
    expect(props().formErrors).toEqual({ [formField]: message });
    expect(props().formValues).toEqual({ fullName: "Person", email: "person@example.com", title: "Engineer" });
    expect(props().state.state).toBe("form");
    expect(props().isSubmitting).toBe(false);
  } finally {
    errorLog.mockRestore();
  }
});

it("replaces a server field error and invites after correction", async () => {
  mockMemberType = "team_member";
  jest.mocked(axios.post).mockRejectedValueOnce({
    response: { data: { message: "Email is too long", details: { field: "email" } } },
  });
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    renderHook(() => null, { initialProps: undefined, wrapper });
    fillForm();
    await act(() => props().onSubmit());
    expect(props().formErrors).toEqual({ email: "Email is too long" });
    expect(props().formValues.title).toBe("Engineer");

    act(() => {
      props().onFormChange("email", "corrected@example.com");
      props().onFormChange("fullName", "  ");
    });
    await act(() => props().onSubmit());
    expect(props().formErrors).toEqual({ fullName: "Name is required" });
    expect(axios.post).toHaveBeenCalledTimes(1);

    act(() => props().onFormChange("fullName", "Person"));
    await act(() => props().onSubmit());

    expect(props().formErrors).toEqual({});
    expect(props().isSubmitting).toBe(false);
    expect(props().state.state).toBe("added");
    expect(axios.post).toHaveBeenCalledTimes(2);
  } finally {
    errorLog.mockRestore();
  }
});
