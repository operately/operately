import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  return { space: await Spaces.getSpace({ id: params.id }) };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
