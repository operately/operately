import { fetchCompany } from "@/models/companies/companyLayoutQueries";
import { redirect, replace } from "react-router";

interface FeatureRedirect {
  feature: string;
  path: string;
}

export async function redirectIfFeatureEnabled(request: Request, { feature, path }: FeatureRedirect) {
  if (await hasFeatureEnabled(request, feature)) redirectTo(request, path);
}

export async function redirectIfFeatureNotEnabled(request: Request, { feature, path }: FeatureRedirect) {
  if (!(await hasFeatureEnabled(request, feature))) redirectTo(request, path);
}

async function hasFeatureEnabled(request: Request, feature: string) {
  const company = await fetchCompany();
  request.signal.throwIfAborted();
  return company.enabledExperimentalFeatures?.includes(feature) ?? false;
}

function redirectTo(request: Request, path: string): never {
  // Direct entry and Back already moved the browser. A link still needs its own history entry.
  const requestUrl = new URL(request.url);
  const replaceEntry = atBrowserLocation(requestUrl) || atBrowserLocation(new URL(path, requestUrl));
  throw replaceEntry ? replace(path) : redirect(path);
}

function atBrowserLocation(url: URL) {
  return url.pathname === window.location.pathname && url.search === window.location.search;
}
