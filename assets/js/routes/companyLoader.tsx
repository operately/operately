import Api from "@/api";
import * as Socket from "@/api/socket";
import * as Companies from "@/models/companies";

import { checkAuth } from "@/routes/pageRoute";

const cache = {};

export async function companyLoader({ params }): Promise<{ company: Companies.Company }> {
  checkAuth();

  Api.default.setHeaders({ "x-company-id": params.companyId });
  Socket.setHeaders({ "x-company-id": params.companyId });

  console.log("is cache", !!cache[params.companyId]);

  if (cache[params.companyId]) {
    return { company: cache[params.companyId] };
  } else {
    console.log("companyLoader", params);

    const company = await Companies.getCompany({ id: params.companyId }).then((d) => d.company!);
    cache[params.companyId] = company;
    return { company };
  }
}
