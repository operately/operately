import React from "react";

import { SecondaryButton, IconPlus, SwitchToggle, showErrorToast } from "turboui";
import { nextEnabledFeatures, setFeatureEnabled } from "./featureFlags";
import { useDisableCompanyFeatures, useEnableCompanyFeature } from "./featureFlagsLifecycle";

interface FeatureFlagsSectionProps {
  companyId: string;
  enabledFeatures: string[];
  onAdd: () => void;
}

export function FeatureFlagsSection({ companyId, enabledFeatures, onAdd }: FeatureFlagsSectionProps) {
  const enableFeature = useEnableCompanyFeature();
  const disableFeatures = useDisableCompanyFeatures();
  const [localFeatures, setLocalFeatures] = React.useState(enabledFeatures);
  const [pendingFeature, setPendingFeature] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalFeatures(enabledFeatures);
  }, [enabledFeatures]);

  const handleToggle = async (feature: string, enabled: boolean) => {
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
      setPendingFeature(null);
    }
  };

  return (
    <div className="mt-8" data-test-id="feature-flags-section">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold">Feature flags</h2>
          <p className="text-sm text-content-accent mt-1 max-w-lg">
            Turn experimental features on or off for this company.
          </p>
        </div>
        <SecondaryButton size="sm" icon={IconPlus} onClick={onAdd} testId="enable-feature">
          Add feature flag
        </SecondaryButton>
      </div>

      {localFeatures.length === 0 ? (
        <div className="py-4 text-sm text-content-dimmed" data-test-id="no-feature-flags">
          No feature flags are enabled.
        </div>
      ) : (
        <div className="border-y border-stroke-base mt-3" data-test-id="feature-flags-list">
          {localFeatures.map((feature) => (
            <div
              key={feature}
              className="flex items-center justify-between gap-4 py-3 px-1 border-b border-stroke-base last:border-b-0"
              data-test-id={`feature-flag-row-${feature}`}
            >
              <code className="text-sm text-content-accent">{feature}</code>
              <SwitchToggle
                label={`Toggle ${feature}`}
                labelHidden
                value={true}
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
