import * as Pages from "@/components/Pages";
import { Space, getSpace } from "@/api"

interface LoaderResult {
  space: Space;
}

export async function loader({params}) : Promise<LoaderResult> {
  const spacePromise = getSpace({
    id: params.id,
  }).then(res => res.space!);

  return {
    space: await spacePromise,
  };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderResult;
}