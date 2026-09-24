/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { act, renderHook } from "@/__tests__/renderHook";
import i18n, { applyLanguage } from "@/i18n";
import page from "./index";
import { CompanyAdminManagePeoplePage } from "turboui";

jest.mock("./loader", () => ({
  useLoadedData: () => mockLoadedData,
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me" }) }));
jest.mock("@/routes/paths", () => ({ usePaths: () => mockPaths, includesId: () => true }));
jest.mock("turboui", () => ({ CompanyAdminManagePeoplePage: jest.fn(() => null) }));
jest.mock("@/models/companies", () => ({
  useRemoveCompanyMember: () => ({}),
  useNewInvitationToken: () => ({}),
  useConvertMemberToGuest: () => ({}),
  useUpdateMembersPermissions: () => ({}),
}));
jest.mock("@/models/people", () => ({ hasValidInvite: () => true, hasInvitationExpired: () => false }));

const mockPaths = {
  companyAdminPath: () => "/admin",
  invitePeoplePath: () => "/invite",
  profilePath: () => "/profile",
  profileEditPath: () => "/profile/edit",
};
const mockInviteLink = { expiresAt: "" };
const mockLoadedData = {
  company: { name: "Company", permissions: {} },
  invitedPeople: [{ id: "invitee", fullName: "Invitee", inviteLink: mockInviteLink }],
  currentMembers: [],
  guests: [],
};

afterEach(async () => {
  await act(async () => {
    await applyLanguage("en");
  });
});

it("updates navigation when the language changes while mounted", async () => {
  mockInviteLink.expiresAt = new Date(Date.now() + 30_000).toISOString();
  i18n.addResourceBundle(
    "pt-BR",
    "translation",
    {
      "Company Administration": "Administração da empresa",
      "less than a minute": "menos de um minuto",
    },
    true,
    true,
  );
  renderHook(() => null, { initialProps: undefined, wrapper: page.Page });
  const props = () => jest.mocked(CompanyAdminManagePeoplePage).mock.calls.at(-1)?.[0];
  expect(props()?.navigationItems[0]?.label).toBe("Company Administration");

  await act(async () => {
    await applyLanguage("pt-BR");
  });

  expect(props()?.navigationItems[0]?.label).toBe("Administração da empresa");
  expect(props()?.invitedPeople[0]?.expiresIn).toBe("menos de um minuto");
});
