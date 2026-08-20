import type { ProductRelease } from "@/api";
import * as Companies from "@/models/companies";
import { PRODUCT_RELEASE_ANNOUNCEMENTS_FEATURE } from "@/routes/companyLoader";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

import { formatProductReleaseVersion } from "./formatVersion";

export interface CurrentProductRelease {
  version: string;
  title: string;
}

/**
 * The release to advertise in the app, or null when the company does not have the
 * announcements feature, no release is cached, or the id is not a known version slug.
 */
export function currentProductRelease(
  company: Companies.Company,
  release: ProductRelease | null | undefined,
): CurrentProductRelease | null {
  if (!Companies.hasFeature(company, PRODUCT_RELEASE_ANNOUNCEMENTS_FEATURE)) return null;

  const version = formatProductReleaseVersion(release?.id);
  if (!version || !release) return null;

  return { version, title: release.title };
}

export function useCurrentProductRelease(company: Companies.Company): CurrentProductRelease | null {
  const { productRelease } = useCompanyLoaderData();

  return currentProductRelease(company, productRelease);
}
