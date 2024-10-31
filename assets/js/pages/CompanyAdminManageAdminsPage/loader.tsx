import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";

interface LoaderResult {
  company: Companies.Company;
  admins: People.Person[];
  owners: People.Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({
    id: params.companyId,
    includeAdmins: true,
    includeOwners: true,
  }).then((d) => d.company!);

  return {
    company: company,
    admins: company.admins!,
    owners: company.owners!,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
