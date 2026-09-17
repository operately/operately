import * as AdminApi from "@/ee/admin_api";

export async function setFeatureEnabled({
  companyId,
  feature,
  enabled,
  enableFeature,
  disableFeatures,
}: {
  companyId: string;
  feature: string;
  enabled: boolean;
  enableFeature: (input: AdminApi.EnableFeatureInput) => Promise<AdminApi.EnableFeatureResult>;
  disableFeatures: (input: AdminApi.DisableFeaturesInput) => Promise<AdminApi.DisableFeaturesResult>;
}): Promise<void> {
  if (enabled) {
    await enableFeature({ companyId, feature });
    return;
  }

  await disableFeatures({ companyId, features: [feature] });
}

export function nextEnabledFeatures(enabledFeatures: string[], feature: string, enabled: boolean): string[] {
  if (enabled) {
    if (enabledFeatures.includes(feature)) return enabledFeatures;
    return [...enabledFeatures, feature];
  }

  return enabledFeatures.filter((enabledFeature) => enabledFeature !== feature);
}
