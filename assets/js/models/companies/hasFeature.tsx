import { Company } from "@/api";
import { assertPresent } from "@/utils/assertions";

export function hasFeature(company: Company, feature: string) {
  assertPresent(company.enabledExperimentalFeatures, "experimental features must be present");

  return company.enabledExperimentalFeatures.includes(feature);
}
