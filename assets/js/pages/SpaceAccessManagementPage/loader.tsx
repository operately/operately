import * as Pages from "@/components/Pages";
import { Company, Space, getCompany, getSpace } from "@/api"

interface LoaderResult {
  space: Space;
  company: Company;
}

export async function loader({params}) : Promise<LoaderResult> {
  const [company, space] = await Promise.all([
    getCompany({ id: params.companyId }),
    getSpace({
      id: params.id,
      includeMembers: true,
      includeMembersAccessLevels: true,
      includeAccessLevels: true,
    }),
  ]);

  return {
    company: company.company!,
    space: space.space!,
  };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderResult;
}