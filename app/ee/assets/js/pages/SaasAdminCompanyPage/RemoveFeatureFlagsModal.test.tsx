import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RemoveFeatureFlagsModal, removedFeatures, saveRemoveFeatureFlags } from "./RemoveFeatureFlagsModal";

const mockDisableFeatures = jest.fn();

jest.mock("@/ee/admin_api", () => ({
  useDisableFeatures: () => [mockDisableFeatures, { data: null, loading: false, error: null }],
}));

jest.mock("@/components/Modal", () => ({
  __esModule: true,
  default: ({ isOpen, title, children }: { isOpen: boolean; title?: string; children: React.ReactNode }) =>
    isOpen ? (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));

const mockShowErrorToast = jest.fn();

jest.mock("turboui", () => ({
  showErrorToast: (...args: unknown[]) => mockShowErrorToast(...args),
  IconTrash: () => <span>trash</span>,
  PrimaryButton: ({
    children,
    disabled,
    testId,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    testId?: string;
  }) => (
    <button data-test-id={testId} disabled={disabled}>
      {children}
    </button>
  ),
  SecondaryButton: ({ children, testId }: { children: React.ReactNode; testId?: string }) => (
    <button data-test-id={testId}>{children}</button>
  ),
}));

describe("RemoveFeatureFlagsModal", () => {
  beforeEach(() => {
    mockDisableFeatures.mockReset().mockResolvedValue({ success: true });
    mockShowErrorToast.mockReset();
  });

  it("renders all enabled features", () => {
    const markup = renderToStaticMarkup(
      <RemoveFeatureFlagsModal
        isOpen={true}
        onClose={() => {}}
        companyId="company-1"
        enabledFeatures={["feature_a", "feature_b", "feature_c"]}
      />,
    );

    expect(markup).toContain("feature_a");
    expect(markup).toContain("feature_b");
    expect(markup).toContain("feature_c");
  });

  it("shows empty state when no features are enabled", () => {
    const markup = renderToStaticMarkup(
      <RemoveFeatureFlagsModal isOpen={true} onClose={() => {}} companyId="company-1" enabledFeatures={[]} />,
    );

    expect(markup).toContain("No feature flags enabled");
  });
});

describe("removedFeatures", () => {
  it("returns an empty list when nothing was removed", () => {
    expect(removedFeatures(["feature_a", "feature_b"], ["feature_a", "feature_b"])).toEqual([]);
  });

  it("returns only the features that were removed locally", () => {
    expect(removedFeatures(["feature_a", "feature_b", "feature_c"], ["feature_a", "feature_c"])).toEqual(["feature_b"]);
  });
});

describe("saveRemoveFeatureFlags", () => {
  beforeEach(() => {
    mockDisableFeatures.mockReset().mockResolvedValue({ success: true });
  });

  it("does not call the API when saving with no removals", async () => {
    const onClose = jest.fn();
    const onSaved = jest.fn();

    await saveRemoveFeatureFlags({
      companyId: "company-1",
      originalFeatures: ["feature_a", "feature_b"],
      localFeatures: ["feature_a", "feature_b"],
      disableFeatures: mockDisableFeatures,
      onClose,
      onSaved,
    });

    expect(mockDisableFeatures).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("calls the API with removed features and invokes onSaved", async () => {
    const onClose = jest.fn();
    const onSaved = jest.fn();

    await saveRemoveFeatureFlags({
      companyId: "company-1",
      originalFeatures: ["feature_a", "feature_b", "feature_c"],
      localFeatures: ["feature_a", "feature_c"],
      disableFeatures: mockDisableFeatures,
      onClose,
      onSaved,
    });

    expect(mockDisableFeatures).toHaveBeenCalledWith({
      companyId: "company-1",
      features: ["feature_b"],
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("propagates API errors to the caller", async () => {
    const apiError = new Error("Network error");
    mockDisableFeatures.mockRejectedValue(apiError);

    await expect(
      saveRemoveFeatureFlags({
        companyId: "company-1",
        originalFeatures: ["feature_a", "feature_b"],
        localFeatures: ["feature_a"],
        disableFeatures: mockDisableFeatures,
        onClose: jest.fn(),
        onSaved: jest.fn(),
      }),
    ).rejects.toThrow("Network error");
  });
});
