import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";

interface LoaderResult {
  group: Groups.Group;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    group: await Groups.getGroup(params.id),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
