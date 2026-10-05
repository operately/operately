/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { BillingDangerBanner } from "./BillingDangerBanner";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

// Match the single React/i18n runtime used by the app bundle.
jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-router", () => jest.requireActual("react-router"));
jest.mock("../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));
jest.mock("../../../../../turboui/src/icons", () => ({ IconAlertTriangleFilled: () => null }));
jest.mock("@/models/billing", () => jest.requireActual("../../models/billing/dangerBanner"));
jest.mock("@/features/SupportSessions", () => ({ useHasSupportSessionCookie: () => false }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({
  useFormattedTimePreferences: () => ({ locale: "en-US", timezone: "UTC", timeFormat: "automatic" }),
}));
jest.mock("@/routes/useCompanyLoaderData", () => ({ useCompanyLoaderData: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ companyBillingPath: () => "/billing", companyBillingPlansPath: () => "/billing/plans" }),
}));
jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../../turboui/src/BillingDangerBanner"),
  ...jest.requireActual("../../../../../turboui/src/CompanyBilling/storageFormatting"),
  i18nOptions: jest.requireActual("../../../../../turboui/src/i18nOptions").i18nOptions,
}));

afterEach(async () => {
  await applyLanguage("en");
});

function renderBanner(canManageBilling: boolean, pathname = "/home") {
  (useCompanyLoaderData as jest.Mock).mockReturnValue({
    company: { permissions: { canManageBilling } },
    billingAccessState: { accessState: "payment_grace", accessStateReason: "past_due", accessStateEndsAt: null },
  });
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  const container = document.createElement("div");
  const root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[pathname]}>
        <BillingDangerBanner />
      </MemoryRouter>,
    ),
  );

  return { container, unmount: () => act(() => root.unmount()) };
}

test.each([
  [true, "Problema no pagamento requer atenção"],
  [false, "Payment issue requires attention"],
])("saved Portuguese preference respects flag: %s", async (enabled, title) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));

  const view = renderBanner(true);

  try {
    expect(view.container.textContent).toContain(title);
    expect(view.container.querySelector("a")?.getAttribute("href")).toBe("/billing");
  } finally {
    view.unmount();
  }
});

test("non-managers get contact instructions without a billing CTA", async () => {
  await applyLanguage("pt-BR");

  const view = renderBanner(false);

  try {
    expect(view.container.textContent).toContain("Entre em contato com um administrador ou proprietário.");
    expect(view.container.querySelector("a")).toBeNull();
  } finally {
    view.unmount();
  }
});

test.each(["/billing", "/billing/plans"])("billing management path hides the banner: %s", (pathname) => {
  const view = renderBanner(true, pathname);

  try {
    expect(view.container.innerHTML).toBe("");
  } finally {
    view.unmount();
  }
});
