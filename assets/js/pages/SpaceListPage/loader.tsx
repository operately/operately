import * as Spaces from "@/models/spaces";
import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

interface LoaderData {
  company: Companies.Company;
  spaces: Spaces.Space[];
}

export async function loader({ params }): Promise<LoaderData> {
  return {
    company: await Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
    spaces: await Spaces.getSpaces({
      includeAccessLevels: true,
    }),
  };
}

export function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}
