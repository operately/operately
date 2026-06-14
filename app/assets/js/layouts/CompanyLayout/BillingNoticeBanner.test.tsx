import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BillingNoticeBanner } from "./BillingNoticeBanner";
import * as Companies from "@/models/companies";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

jest.mock("@/components/FormattedTime", () => ({
  __esModule: true,
  default: ({ time }: { time: string }) => <span>{time}</span>,
}));

jest.mock("@/hooks/useStateWithLocalStorage", () => ({
  useStateWithLocalStorage: jest.fn(),
}));

jest.mock("@/models/companies", () => ({
  hasFeature: jest.fn(),
}));

jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: jest.fn(),
}));

jest.mock("turboui", () => ({
  IconInfoCircleFilled: () => <span>info-icon</span>,
  IconX: () => <span>dismiss-icon</span>,
}));

const mockUseCompanyLoaderData = useCompanyLoaderData as jest.Mock;
const mockUseStateWithLocalStorage = useStateWithLocalStorage as jest.Mock;
const mockHasFeature = Companies.hasFeature as jest.Mock;

function setBillingEnabled(enabled: boolean) {
  (globalThis as any).window = { appConfig: { billingEnabled: enabled } };
}

function company(overrides: Record<string, unknown> = {}) {
  return {
    enabledExperimentalFeatures: ["billing-notice"],
    permissions: {
      canManageBilling: true,
    },
    ...overrides,
  };
}

describe("BillingNoticeBanner", () => {
  beforeEach(() => {
    setBillingEnabled(true);
    mockUseStateWithLocalStorage.mockReturnValue([false, jest.fn()]);
    mockHasFeature.mockImplementation((company, feature) => company.enabledExperimentalFeatures?.includes(feature));
  });

  afterEach(() => {
    delete (globalThis as any).window;
    jest.resetAllMocks();
  });

  it("renders for flagged companies with billing-management copy", () => {
    mockUseCompanyLoaderData.mockReturnValue({ company: company() });

    const markup = renderToStaticMarkup(<BillingNoticeBanner />);

    expect(markup).toContain("billing-notice-banner");
    expect(markup).toContain("billing-notice-banner-dismiss");
    expect(markup).toContain("New billing and plans are coming to Operately");
    expect(markup).toContain("Starting");
    expect(markup).toContain("2026-06-29")
    expect(markup).toContain(
      "You&#x27;ll be able to review plan options, usage, and billing details in Company Administration.",
    );
    expect(markup).toContain("Member and storage limits will depend on the company&#x27;s plan.");
    expect(markup).toContain("No action is required today.");
  });

  it("does not render for companies without the billing-notice feature", () => {
    mockUseCompanyLoaderData.mockReturnValue({ company: company({ enabledExperimentalFeatures: ["billing"] }) });

    const markup = renderToStaticMarkup(<BillingNoticeBanner />);

    expect(markup).toBe("");
  });

  it("does not render when billing is disabled at the instance level", () => {
    setBillingEnabled(false);
    mockUseCompanyLoaderData.mockReturnValue({ company: company() });

    const markup = renderToStaticMarkup(<BillingNoticeBanner />);

    expect(markup).toBe("");
  });

  it("does not render after the banner has been dismissed", () => {
    mockUseCompanyLoaderData.mockReturnValue({ company: company() });
    mockUseStateWithLocalStorage.mockReturnValue([true, jest.fn()]);

    const markup = renderToStaticMarkup(<BillingNoticeBanner />);

    expect(markup).toBe("");
  });

  it("uses the non-manager copy for people who cannot manage billing", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      company: company({
        permissions: {
          canManageBilling: false,
        },
      }),
    });

    const markup = renderToStaticMarkup(<BillingNoticeBanner />);

    expect(markup).toContain(
      "Admins and owners will be able to review plan options, usage, and billing details in Company Administration.",
    );
    expect(markup).not.toContain(
      "You&#x27;ll be able to review plan options, usage, and billing details in Company Administration.",
    );
  });
});
