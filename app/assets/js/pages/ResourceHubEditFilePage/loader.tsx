import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const fileInput = {
    id: params.id,
    includePathToFile: true,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
  };

  await Api.files.getQuery(fileInput);

  return { fileInput };
}

export function useLoadedData() {
  const { fileInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.files.getQueryOptions(fileInput));

  const file = data?.file;

  if (!file?.id) throw new Error("File data is unavailable");
  if (!file.resourceHubId) throw new Error("File resource hub is unavailable");

  return { file: { ...file, resourceHubId: file.resourceHubId } };
}
