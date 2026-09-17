import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const companyInput = { includeOwners: true, includeAdmins: true, includePermissions: true };
  const spacesInput = { includeAccessLevels: true };

  const [{ company }] = await Promise.all([Api.companies.getQuery(companyInput), Api.spaces.listQuery(spacesInput)]);
  const workMapInput = company.setupCompleted ? null : {};

  if (workMapInput) await Api.companies.getWorkMapQuery(workMapInput);

  return { companyInput, spacesInput, workMapInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { companyInput, spacesInput, workMapInput } = Pages.useLoadedData<LoaderResult>();
  const { data: companyData } = useLoadedQuery(Api.companies.getQueryOptions(companyInput));
  const { data: spacesData } = useLoadedQuery(Api.spaces.listQueryOptions(spacesInput));
  const { data: workMapData } = useLoadedQuery({
    ...Api.companies.getWorkMapQueryOptions(workMapInput ?? {}),
    enabled: workMapInput !== null,
  });
  const company = companyData?.company;

  if (!company || !spacesData || (workMapInput !== null && !workMapData))
    throw new Error("Home page data is unavailable");

  return {
    company,
    spaces: spacesData.spaces ?? [],
    adminIds: (company.admins ?? []).map((person) => person.id),
    ownerIds: (company.owners ?? []).map((person) => person.id),
    hasWorkItems: workMapInput !== null && (workMapData?.workMap.length ?? 0) > 0,
  };
}
