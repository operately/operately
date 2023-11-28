import * as Pages from "@/components/Pages";

interface LoaderResult {
}

export async function loader({params}) : Promise<LoaderResult> {
  // TODO: Implement

  return {}
}

export function useLoadedData() : LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
