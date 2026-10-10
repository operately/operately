import AdminApi from "@/ee/admin_api";
import { useLoadedQuery } from "@/api/queryClient";

export async function loader() {
  await AdminApi.curated_templates.listQuery({});
  return {};
}

export function useLoadedData() {
  const { data } = useLoadedQuery(AdminApi.curated_templates.listQueryOptions({}));
  return { templates: data?.templates ?? [] };
}
