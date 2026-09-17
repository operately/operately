import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FeatureFlagsSection } from "./FeatureFlagsSection";

jest.mock("./featureFlagsLifecycle", () => ({
  useEnableCompanyFeature: () => ({ mutateAsync: jest.fn() }),
  useDisableCompanyFeatures: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
  SecondaryButton: ({ children, testId }: { children: React.ReactNode; testId?: string }) => (
    <button data-test-id={testId}>{children}</button>
  ),
  IconPlus: () => null,
  SwitchToggle: ({ label, testId }: { label: string; testId?: string }) => (
    <button data-test-id={testId} aria-label={label}>
      toggle
    </button>
  ),
}));

describe("FeatureFlagsSection", () => {
  it("renders enabled feature flags with toggles", () => {
    const markup = renderToStaticMarkup(
      <FeatureFlagsSection companyId="company-1" enabledFeatures={["feature_a", "feature_b"]} onAdd={() => {}} />,
    );

    expect(markup).toContain("feature_a");
    expect(markup).toContain("feature_b");
    expect(markup).toContain("feature-flag-toggle-feature_a");
    expect(markup).toContain("feature-flag-toggle-feature_b");
    expect(markup).toContain("enable-feature");
  });

  it("shows empty state when no features are enabled", () => {
    const markup = renderToStaticMarkup(
      <FeatureFlagsSection companyId="company-1" enabledFeatures={[]} onAdd={() => {}} />,
    );

    expect(markup).toContain("no-feature-flags");
  });
});
