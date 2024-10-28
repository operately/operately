import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
  adminIds: string[];
  ownerIds: string[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({
    id: params.companyId,
    includeAdmins: true,
    includeOwners: true,
    includePermissions: true,
  }).then((d) => d.company!);

  return {
    company: company,
    adminIds: company!.admins!.map((a) => a.id!),
    ownerIds: company!.owners!.map((o) => o.id!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
