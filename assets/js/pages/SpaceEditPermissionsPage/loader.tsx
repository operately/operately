import * as Pages from "@/components/Pages";

import { Company, Space, getCompany, getSpace } from "@/api";


interface LoaderResult {
  company: Company;
  space: Space;
}

export async function loader({ params }) : Promise<LoaderResult> {
  const [company, space] = await Promise.all([
    getCompany({ id: params.companyId }),
    getSpace({ id: params.id, includeAccessLevels: true }),
  ]);
  
  return {
    company: company.company!,
    space: space.space!,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}