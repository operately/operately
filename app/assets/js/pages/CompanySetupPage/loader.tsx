import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Spaces from "@/models/spaces";
import * as WorkMap from "@/models/workMap";

interface LoaderData {
  company: Companies.Company;
  spaces: Spaces.Space[];
  workMap: WorkMap.WorkMapItem[];
}

export async function loader({ params }): Promise<LoaderData> {
  return {
    company: await Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
    spaces: await Spaces.getSpaces({
      includeAccessLevels: true,
    }),
    workMap: await WorkMap.getWorkMap({}).then((d) => d.workMap || []),
  };
}

export function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}
