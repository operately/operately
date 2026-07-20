import Api from "@/api";
import * as Socket from "@/api/socket";
import * as Billing from "@/models/billing";
import * as Companies from "@/models/companies";
import * as SiteMessages from "@/models/siteMessages";

import { checkAuth } from "@/routes/pageRoute";

export interface CompanyLoadedData {
  company: Companies.Company;
  billingAccessState: Billing.BillingCompanyAccessState | null;
  canAddProject: boolean;
  canAddGoal: boolean;
  siteMessages: SiteMessages.SiteMessage[];
}

export async function companyLoader({ params }): Promise<CompanyLoadedData> {
  checkAuth();

  Api.default.setHeaders({ "x-company-id": params.companyId });
  Socket.setHeaders({ "x-company-id": params.companyId });

  try {
    const [company, spacesCount, siteMessages] = await Promise.all([
      Companies.getCompany({ includeOwners: true, includePermissions: true }).then((d) => d.company!),
      Api.spaces.countByAccessLevel({ accessLevel: "edit_access" }).then((d) => d.count || 0),
      SiteMessages.listActive({})
        .then((d) => d.messages ?? [])
        .catch(() => []),
    ]);

    const billingAccessState = await fetchBillingAccessState();

    return { company, billingAccessState, canAddProject: spacesCount > 0, canAddGoal: spacesCount > 0, siteMessages };
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

async function fetchBillingAccessState(): Promise<Billing.BillingCompanyAccessState | null> {
  if (!window.appConfig.billingEnabled) {
    return null;
  }

  try {
    return await Billing.getAccessState({});
  } catch {
    return null;
  }
}
