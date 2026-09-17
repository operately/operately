/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { CompanyAdminAddPeoplePage } from "turboui";
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
afterEach(() => queryClient.clear());

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
