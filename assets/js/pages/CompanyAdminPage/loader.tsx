import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({ id: params.companyId, includeAdmins: true }).then((d) => d.company!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
