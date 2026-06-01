import Api from "@/api";
import * as Socket from "@/api/socket";
import * as Billing from "@/models/billing";
import * as Companies from "@/models/companies";

import { checkAuth } from "@/routes/pageRoute";

export interface CompanyLoadedData {
  company: Companies.Company;
  billingAccessState: Billing.BillingCompanyAccessState | null;
  billingLimitWarnings: Billing.BillingLimitWarnings | null;
  canAddProject: boolean;
  canAddGoal: boolean;
}

export async function companyLoader({ params }): Promise<CompanyLoadedData> {
  checkAuth();

  Api.default.setHeaders({ "x-company-id": params.companyId });
  Socket.setHeaders({ "x-company-id": params.companyId });

  try {
    const [company, spacesCount] = await Promise.all([
      Companies.getCompany({ includeOwners: true, includePermissions: true }).then((d) => d.company!),
      Api.spaces.countByAccessLevel({ accessLevel: "edit_access" }).then((d) => d.count || 0),
    ]);

    const [billingAccessState, billingLimitWarnings] = await Promise.all([
      fetchBillingAccessState(company),
      fetchBillingLimitWarnings(company),
    ]);

    return { company, billingAccessState, billingLimitWarnings, canAddProject: spacesCount > 0, canAddGoal: spacesCount > 0 };
  } catch (error) {
    // If the company ID is invalid, the API will return a 400 message, but for the rest of the application, we can treat it as 404.
    if (error["status"] === 400) {
      error["status"] = 404;
      throw error;
    } else {
      throw error;
    }
  }
}

async function fetchBillingAccessState(company: Companies.Company): Promise<Billing.BillingCompanyAccessState | null> {
  if (!window.appConfig.billingEnabled) {
    return null;
  }

  if (!company.enabledExperimentalFeatures?.includes("billing")) {
    return null;
  }

  try {
    return await Billing.getAccessState({});
  } catch {
    return null;
  }
}

async function fetchBillingLimitWarnings(company: Companies.Company): Promise<Billing.BillingLimitWarnings | null> {
  if (!window.appConfig.billingEnabled) {
    return null;
  }

  if (!company.enabledExperimentalFeatures?.includes("billing")) {
    return null;
  }

  if (!company.permissions?.isAdmin) {
    return null;
  }

  try {
    return await Billing.getLimitWarnings({});
  } catch {
    return null;
  }
}
