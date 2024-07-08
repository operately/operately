import * as Companies from "@/models/companies";

export async function companyLoader({ params }): Promise<{ company: Companies.Company }> {
  const company = await Companies.getCompany({ id: params.companyId }).then((d) => d.company!);

  return { company };
}
