import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FeatureFlagsSection } from "./FeatureFlagsSection";

jest.mock("./featureFlagsLifecycle", () => ({
  useEnableCompanyFeature: () => ({ mutateAsync: jest.fn() }),
  useDisableCompanyFeatures: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("turboui", () => ({
  showErrorToast: jest.fn(),
  SwitchToggle: ({ label, testId, value }: { label: string; testId?: string; value: boolean }) => (
    <button data-test-id={testId} aria-label={label} data-enabled={value ? "true" : "false"}>
      toggle
    </button>
  ),
}));

describe("FeatureFlagsSection", () => {
  it("renders available feature flags with toggles even when none are enabled", () => {
    const markup = renderToStaticMarkup(
      <FeatureFlagsSection companyId="company-1" availableFeatures={["project_templates"]} enabledFeatures={[]} />,
    );

    expect(markup).toContain("feature-flag-toggle-project_templates");
    expect(markup).toContain('data-enabled="false"');
    expect(markup).not.toContain("enable-feature");
    expect(markup).not.toContain("no-feature-flags");
  });

  it("renders enabled feature flags as on", () => {
    const markup = renderToStaticMarkup(
      <FeatureFlagsSection
        companyId="company-1"
        availableFeatures={["project_templates"]}
        enabledFeatures={["project_templates"]}
      />,
    );

    expect(markup).toContain("feature-flag-toggle-project_templates");
    expect(markup).toContain('data-enabled="true"');
  });

  it("shows empty state when there are no available or enabled flags", () => {
    const markup = renderToStaticMarkup(
      <FeatureFlagsSection companyId="company-1" availableFeatures={[]} enabledFeatures={[]} />,
    );

    expect(markup).toContain("no-feature-flags");
    expect(markup).toContain("border-y");
    expect(markup).not.toContain("enable-feature");
    expect(markup).not.toContain("feature-flags-list");
  });
});
