import * as Spaces from "@/models/spaces";
import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

interface LoaderData {
  company: Companies.Company;
  spaces: Spaces.Space[];
}

export async function loader(): Promise<LoaderData> {
  return {
    company: await Companies.getCompany(),
    spaces: await Spaces.getSpaces({}),
  };
}

export function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}
