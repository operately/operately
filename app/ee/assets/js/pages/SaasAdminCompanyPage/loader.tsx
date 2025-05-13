import * as AdminApi from "@/ee/admin_api";
import * as Pages from "@/components/Pages";

interface LoaderData {
  company: AdminApi.Company;
}

export async function loader({ params }): Promise<LoaderData> {
  return { company: await AdminApi.getCompany({ id: params.companyId }).then((res) => res.company!) };
}

export function useLoadedData(): LoaderData {
  return Pages.useLoadedData() as LoaderData;
}
