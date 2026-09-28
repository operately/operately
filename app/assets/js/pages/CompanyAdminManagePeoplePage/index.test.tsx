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

const english = { ...i18n.getResourceBundle("en", "translation") };
const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };

afterEach(async () => {
  jest.useRealTimers();
  for (const [language, resources] of [
    ["en", english],
    ["pt-BR", portuguese],
  ] as const) {
    i18n.removeResourceBundle(language, "translation");
    i18n.addResourceBundle(language, "translation", resources);
  }
  await act(async () => {
    await applyLanguage("en");
  });
});

it.each([
  ["en", false, 1, "1 minute"],
  ["en", false, 2, "2 minutes"],
  ["en", true, 1, "Translated minute"],
  ["en", true, 2, "Translated 2 minutes"],
  ["pt-BR", false, 1, "1 minute"],
  ["pt-BR", false, 2, "2 minutes"],
])(
  "looks up invitation expiry plurals and falls back to English: %s / %s / %i",
  async (language, substituted, minutes, expected) => {
    jest.useFakeTimers().setSystemTime(new Date("2026-09-25T12:00:00Z"));
    mockInviteLink.expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
    // Simulate missing Portuguese forms without changing the reviewed catalog.
    i18n.removeResourceBundle("pt-BR", "translation");
    if (substituted) {
      i18n.addResourceBundle(
        "en",
        "translation",
        {
          "1 minute_one": "Translated minute",
          "1 minute_other": "Translated {{count}} minutes",
        },
        true,
        true,
      );
    }
    await applyLanguage(language);
    renderHook(() => null, { initialProps: undefined, wrapper: page.Page });
    const props = jest.mocked(CompanyAdminManagePeoplePage).mock.calls.at(-1)?.[0];
    expect(props?.invitedPeople[0]?.expiresIn).toBe(expected);
    expect(props?.invitedPeople[0]?.fullName).toBe("Invitee");
  },
);

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
