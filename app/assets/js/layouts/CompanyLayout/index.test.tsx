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
jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: () => ({ company: { id: "company-1", name: "Acme" }, canAddGoal: false, canAddProject: false }),
  useRefreshCompanyLoader: () => jest.fn(),
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "person-1" }) }));
jest.mock("./useGlobalSearch", () => ({ useGlobalSearchHandler: jest.fn(), companySearchPathBuilder: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  Paths: { lobbyPath: () => "/lobby", newCompanyPath: () => "/new" },
  usePaths: () => new Proxy({}, { get: () => () => "/path" }),
}));

it("wires the existing company navigation logout control to shared teardown and redirect", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.appConfig = { ...window.appConfig, releaseVersion: "1.0.0" };
  const root = createRoot(document.createElement("div"));
  try {
    act(() => root.render(<CompanyLayout />));
    expect(jest.mocked(CompanyNavigation).mock.calls[0]?.[0].onLogOut).toBe(logOutAndRedirect);
    expect(jest.mocked(CompanyNavigation).mock.calls[0]?.[0]).toMatchObject({
      companyCount: 1,
      isSiteAdmin: true,
      links: { adminPanel: "/admin", newCompany: "/new" },
    });
  } finally {
    act(() => root.unmount());
  }
});
