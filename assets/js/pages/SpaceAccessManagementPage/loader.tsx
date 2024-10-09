import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  const space = await Spaces.getSpace({
    id: params.id,
    includeMembersAccessLevels: true,
    includeAccessLevels: true,
    includePotentialSubscribers: true,
  });

  return { space: space };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderResult;
}
