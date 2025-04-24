import * as Companies from "@/models/companies";
import { assertPresent } from "@/utils/assertions";
import { redirect } from "react-router-dom";

export async function redirectIfFeatureEnabled(params: any, { feature, path }) {
  assertPresent(params["companyId"], "companyId must be present");

  const company = await Companies.getCompany({ id: params["companyId"] }).then((data) => data.company!);

  if (Companies.hasFeature(company, feature)) {
    throw redirect(path);
  } else {
    return; // do nothing, continue loading the page
  }
}

export async function redirectIfFeatureNotEnabled(params: any, { feature, path }) {
  assertPresent(params["companyId"], "companyId must be present");

  const company = await Companies.getCompany({ id: params["companyId"] }).then((data) => data.company!);

  if (!Companies.hasFeature(company, feature)) {
    throw redirect(path);
  } else {
    return; // do nothing, continue loading the page
  }
}
