import Api from "@/api";
import * as Socket from "@/api/socket";
import * as Companies from "@/models/companies";

export async function companyLoader({ params }): Promise<{ company: Companies.Company }> {
  Api.default.setHeaders({ "x-company-id": params.companyId });
  Socket.setHeaders({ "x-company-id": params.companyId });

  const company = await Companies.getCompany({ id: params.companyId }).then((d) => d.company!);

  return { company };
}
