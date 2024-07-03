import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";


interface LoaderResult {
  company: Companies.Company;
}

export async function loader(): Promise<LoaderResult> {
  const companyPromise = Companies.getCompany();

  return {
    company: await companyPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}