import React from "react";

import { SwitchToggle, showErrorToast } from "turboui";
import { createFeatureToggleLock, listedFeatureFlags, nextEnabledFeatures, setFeatureEnabled } from "./featureFlags";
import { useDisableCompanyFeatures, useEnableCompanyFeature } from "./featureFlagsLifecycle";

interface FeatureFlagsSectionProps {
  companyId: string;
  availableFeatures: string[];
  enabledFeatures: string[];
}

export function FeatureFlagsSection({ companyId, availableFeatures, enabledFeatures }: FeatureFlagsSectionProps) {
  const enableFeature = useEnableCompanyFeature();
  const disableFeatures = useDisableCompanyFeatures();
  const [localFeatures, setLocalFeatures] = React.useState(enabledFeatures);
  const [pendingFeature, setPendingFeature] = React.useState<string | null>(null);
  const toggleLock = React.useRef(createFeatureToggleLock()).current;

  React.useEffect(() => {
    setLocalFeatures(enabledFeatures);
  }, [enabledFeatures]);

  const handleToggle = async (feature: string, enabled: boolean) => {
    if (!toggleLock.tryStart()) return;

    const previous = localFeatures;
    setLocalFeatures(nextEnabledFeatures(localFeatures, feature, enabled));
    setPendingFeature(feature);

    try {
      await setFeatureEnabled({
        companyId,
        feature,
        enabled,
        enableFeature: (input) => enableFeature.mutateAsync(input),
        disableFeatures: (input) => disableFeatures.mutateAsync(input),
      });
    } catch {
      setLocalFeatures(previous);
      showErrorToast("Could not update feature flag", "Please try again.");
    } finally {
      toggleLock.finish();
      setPendingFeature(null);
    }
  };

  const features = listedFeatureFlags(availableFeatures, localFeatures);

  return (
    <div className="mt-8" data-test-id="feature-flags-section">
      <div>
        <h2 className="font-bold">Feature flags</h2>
        <p className="text-sm text-content-accent mt-1 max-w-lg">
          Turn experimental features on or off for this company.
        </p>
      </div>

      {features.length === 0 ? (
        <div className="py-4 text-sm text-content-dimmed" data-test-id="no-feature-flags">
          No feature flags are available.
        </div>
      ) : (
        <div className="border-y border-stroke-base mt-3" data-test-id="feature-flags-list">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center justify-between gap-4 py-3 px-1 border-b border-stroke-base last:border-b-0"
              data-test-id={`feature-flag-row-${feature}`}
            >
              <code className="text-sm text-content-accent">{feature}</code>
              <SwitchToggle
                label={`Toggle ${feature}`}
                labelHidden
                value={localFeatures.includes(feature)}
                setValue={(enabled) => {
                  void handleToggle(feature, enabled);
                }}
                testId={`feature-flag-toggle-${feature}`}
              />
            </div>
          ))}
        </div>
      )}
      {pendingFeature ? <div className="text-xs text-content-dimmed mt-2">Saving…</div> : null}
    </div>
  );
}
