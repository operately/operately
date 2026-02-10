import Api from "@/api";
import * as Socket from "@/api/socket";
import * as Companies from "@/models/companies";

import { checkAuth } from "@/routes/pageRoute";

export interface CompanyLoadedData {
  company: Companies.Company;
  canAddProject: boolean;
  canAddGoal: boolean;
}

export async function companyLoader({ params }): Promise<CompanyLoadedData> {
  checkAuth();

  Api.default.setHeaders({ "x-company-id": params.companyId });
  Socket.setHeaders({ "x-company-id": params.companyId });

  try {
    const [company, spacesCount] = await Promise.all([
      Companies.getCompany({ id: params.companyId, includePermissions: true }).then((d) => d.company!),
      Api.spaces.countByAccessLevel({ accessLevel: "edit_access" }).then((d) => d.count || 0),
    ]);

    return { company, canAddProject: spacesCount > 0, canAddGoal: spacesCount > 0 };
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
