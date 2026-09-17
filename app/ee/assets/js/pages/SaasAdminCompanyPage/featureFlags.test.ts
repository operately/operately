import { createFeatureToggleLock, listedFeatureFlags, nextEnabledFeatures, setFeatureEnabled } from "./featureFlags";

const mockEnableFeature = jest.fn();
const mockDisableFeatures = jest.fn();

describe("createFeatureToggleLock", () => {
  it("rejects a second start until the first toggle finishes", () => {
    const lock = createFeatureToggleLock();

    expect(lock.tryStart()).toBe(true);
    expect(lock.tryStart()).toBe(false);

    lock.finish();

    expect(lock.tryStart()).toBe(true);
  });
});

describe("listedFeatureFlags", () => {
  it("always includes available flags even when none are enabled", () => {
    expect(listedFeatureFlags(["project_templates"], [])).toEqual(["project_templates"]);
  });

  it("keeps extra enabled flags that are not in the available list", () => {
    expect(listedFeatureFlags(["project_templates"], ["legacy_flag", "project_templates"])).toEqual([
      "project_templates",
      "legacy_flag",
    ]);
  });
});

describe("nextEnabledFeatures", () => {
  it("adds a feature when enabling", () => {
    expect(nextEnabledFeatures(["feature_a"], "feature_b", true)).toEqual(["feature_a", "feature_b"]);
  });

  it("does not duplicate an already enabled feature", () => {
    const features = ["feature_a"];
    expect(nextEnabledFeatures(features, "feature_a", true)).toBe(features);
  });

  it("removes a feature when disabling", () => {
    expect(nextEnabledFeatures(["feature_a", "feature_b"], "feature_a", false)).toEqual(["feature_b"]);
  });
});

describe("setFeatureEnabled", () => {
  beforeEach(() => {
    mockEnableFeature.mockReset().mockResolvedValue({ success: true });
    mockDisableFeatures.mockReset().mockResolvedValue({ success: true });
  });

  it("enables a feature", async () => {
    await setFeatureEnabled({
      companyId: "company-1",
      feature: "feature_a",
      enabled: true,
      enableFeature: mockEnableFeature,
      disableFeatures: mockDisableFeatures,
    });

    expect(mockEnableFeature).toHaveBeenCalledWith({ companyId: "company-1", feature: "feature_a" });
    expect(mockDisableFeatures).not.toHaveBeenCalled();
  });

  it("disables a feature", async () => {
    await setFeatureEnabled({
      companyId: "company-1",
      feature: "feature_a",
      enabled: false,
      enableFeature: mockEnableFeature,
      disableFeatures: mockDisableFeatures,
    });

    expect(mockDisableFeatures).toHaveBeenCalledWith({ companyId: "company-1", features: ["feature_a"] });
    expect(mockEnableFeature).not.toHaveBeenCalled();
  });

  it("propagates API errors", async () => {
    mockDisableFeatures.mockRejectedValue(new Error("Network error"));

    await expect(
      setFeatureEnabled({
        companyId: "company-1",
        feature: "feature_a",
        enabled: false,
        enableFeature: mockEnableFeature,
        disableFeatures: mockDisableFeatures,
      }),
    ).rejects.toThrow("Network error");
  });
});
