import * as AdminApi from "@/ee/admin_api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = { id: params.companyId };

  await AdminApi.getCompanyQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { company: AdminApi.Company; companyId: string; availableFeatures: string[] } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(AdminApi.getCompanyQueryOptions(queryInput));

  if (!data?.company) {
    throw new Error(`Company data is unavailable for company "${queryInput.id}"`);
  }

  if (!data.company.id) {
    throw new Error(`Company id is unavailable for company "${queryInput.id}"`);
  }

  return {
    company: data.company,
    companyId: data.company.id,
    availableFeatures: data.availableFeatures ?? [],
  };
}
