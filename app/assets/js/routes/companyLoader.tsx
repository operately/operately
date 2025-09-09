import Api from "@/api";
import * as Socket from "@/api/socket";
import * as Companies from "@/models/companies";

import { checkAuth } from "@/routes/pageRoute";

export async function companyLoader({ params }): Promise<{ company: Companies.Company }> {
  checkAuth();

  Api.default.setHeaders({ "x-company-id": params.companyId });
  Socket.setHeaders({ "x-company-id": params.companyId });

  try {
    const company = await Companies.getCompany({ id: params.companyId }).then((d) => d.company!);
    return { company };
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
