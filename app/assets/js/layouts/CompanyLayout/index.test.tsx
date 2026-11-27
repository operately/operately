/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { CompanyNavigation } from "turboui";
import { logOutAndRedirect } from "@/routes/auth";
import CompanyLayout from "./index";

jest.mock("turboui", () => ({ CompanyNavigation: jest.fn(() => null) }));
jest.mock("react-router", () => ({ Outlet: () => null, useNavigate: () => jest.fn() }));
jest.mock("./MemberOnboarding", () => ({ MemberOnboarding: () => null }));
jest.mock("./contactUsLink", () => ({ contactUsLink: () => "mailto:support@operately.com" }));
jest.mock("./KeyboardShortcutsModal", () => ({
  KeyboardShortcutsModal: () => null,
  useKeyboardShortcutsModal: () => ({ open: jest.fn(), close: jest.fn(), isOpen: false }),
}));
jest.mock("./BillingDangerBanner", () => ({ BillingDangerBanner: () => null }));
jest.mock("./ProductReleaseAnnouncementBanner", () => ({ ProductReleaseAnnouncementBanner: () => null }));
jest.mock("./SiteMessageBanner", () => ({ SiteMessageBanner: () => null }));
jest.mock("./SupportSessionBanner", () => ({ SupportSessionBanner: () => null }));
jest.mock("@/features/DevBar", () => ({ DevBar: () => null }));
jest.mock("@/hooks/useScrollToTopOnNavigationChange", () => ({ useScrollToTopOnNavigationChange: jest.fn() }));
jest.mock("@/models/billing", () => ({ useBillingUpdatedSignal: jest.fn() }));
jest.mock("@/models/assignments", () => ({
  useAssignmentsCount: () => [0, jest.fn()],
  useReviewRefreshSignal: jest.fn(),
}));
jest.mock("@/models/notifications", () => ({ useUnreadCount: () => 0 }));
jest.mock("@/models/companies", () => ({ useCompanies: () => ({ data: { companies: [{ id: "company-1" }] } }) }));
jest.mock("@/models/people", () => ({ useGetAccount: () => ({ data: { account: { siteAdmin: true } } }) }));
jest.mock("@/models/productReleases/useProductRelease", () => ({
  useProductRelease: () => ({ productRelease: null, canAnnounce: false }),
}));
let mockEnabledExperimentalFeatures: string[] | undefined;
jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: () => ({
    company: { id: "company-1", name: "Acme", enabledExperimentalFeatures: mockEnabledExperimentalFeatures },
    canAddGoal: false,
    canAddProject: false,
  }),
  useRefreshCompanyLoader: () => jest.fn(),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "person-1" }) }));
jest.mock("./useGlobalSearch", () => ({ useGlobalSearchHandler: jest.fn(), companySearchPathBuilder: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  Paths: { lobbyPath: () => "/lobby", newCompanyPath: () => "/new" },
  usePaths: () => new Proxy({}, { get: () => () => "/path" }),
}));

function renderNavigation() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.appConfig = { ...window.appConfig, releaseVersion: "1.0.0" };
  const root = createRoot(document.createElement("div"));
  try {
    act(() => root.render(<CompanyLayout />));
    return jest.mocked(CompanyNavigation).mock.lastCall?.[0];
  } finally {
    act(() => root.unmount());
  }
}

beforeEach(() => {
  mockEnabledExperimentalFeatures = undefined;
});

it("wires the existing company navigation logout control to shared teardown and redirect", () => {
  const navigation = renderNavigation();
  expect(navigation?.onLogOut).toBe(logOutAndRedirect);
  expect(navigation).toMatchObject({
    companyCount: 1,
    isSiteAdmin: true,
    links: { adminPanel: "/admin", newCompany: "/new" },
  });
});

it.each([
  { flags: undefined, enabled: false },
  { flags: ["other_feature"], enabled: false },
  { flags: ["work_map_v2"], enabled: true },
])("sets the navbar pilot flag to $enabled for company flags $flags", ({ flags, enabled }) => {
  mockEnabledExperimentalFeatures = flags;

  expect(renderNavigation()?.workMapV2Enabled).toBe(enabled);
});
