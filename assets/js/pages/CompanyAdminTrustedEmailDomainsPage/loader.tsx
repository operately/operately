import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({ id: params.companyId, includePeople: true }).then((d) => d.company!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
