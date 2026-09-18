import * as AdminApi from "@/ee/admin_api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";

export async function loader() {
  const queryInput = {};
  await AdminApi.getUpdateBadgeSettingsQuery(queryInput);

  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(AdminApi.getUpdateBadgeSettingsQueryOptions(queryInput));

  assertPresent(data, "Update badge settings are unavailable");

  return { enabled: data.enabled };
}
