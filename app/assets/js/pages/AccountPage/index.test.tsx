/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { AccountPage } from "turboui";
import { logOutAndRedirect } from "@/routes/auth";
import pageModule from "./index";

jest.mock("turboui", () => ({ AccountPage: jest.fn(() => null) }));
jest.mock("@/components/Pages", () => ({ emptyLoader: jest.fn() }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "person-1" }) }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    profileEditPath: () => "/profile",
    accountSettingsPath: () => "/settings",
    accountNotificationSettingsPath: () => "/notifications",
    accountSecurityPath: () => "/security",
    homePath: () => "/home",
  }),
}));

it("wires the existing account logout control to shared teardown and redirect", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  try {
    act(() => root.render(<pageModule.Page />));
    expect(jest.mocked(AccountPage).mock.calls[0]?.[0].onLogOut).toBe(logOutAndRedirect);
  } finally {
    act(() => root.unmount());
  }
});
