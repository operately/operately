import Api from "@/api";
import { assertPresent } from "@/utils/assertions";
import { redirect } from "react-router";

export async function redirectIfFeatureEnabled(params: any, { feature, path }) {
  assertPresent(params["companyId"], "companyId must be present");

  const features = await getCachedEnabledFeatures(params["companyId"]);

  if (features?.includes(feature)) {
    throw redirect(path);
  } else {
    return; // do nothing, continue loading the page
  }
}

export async function redirectIfFeatureNotEnabled(params: any, { feature, path }) {
  assertPresent(params["companyId"], "companyId must be present");

  const features = await getCachedEnabledFeatures(params["companyId"]);

  if (!features?.includes(feature)) {
    throw redirect(path);
  } else {
    return; // do nothing, continue loading the page
  }
}

export async function hasFeatureEnabled(companyId: string, feature: string) {
  const features = await getCachedEnabledFeatures(companyId);

  return features?.includes(feature);
}

const ENABLED_FEATURES_CACHE: Record<string, string[]> = {};

async function getCachedEnabledFeatures(companyId: string): Promise<string[]> {
  const cached = ENABLED_FEATURES_CACHE[companyId];

  if (cached) {
    return cached;
  } else {
    const { company } = await Api.companies.getQuery({});
    ENABLED_FEATURES_CACHE[companyId] = company.enabledExperimentalFeatures || [];
    return ENABLED_FEATURES_CACHE[companyId]!;
  }
}
