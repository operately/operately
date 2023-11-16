import * as Pages from "@/components/Pages";

export interface LoaderResult {}

export async function loader(): Promise<LoaderResult> {
  return {};
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
