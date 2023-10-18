import * as Paper from "@/components/PaperContainer";

export interface LoaderResult {}

export async function loader(): Promise<LoaderResult> {
  return {};
}

export function useLoadedData(): LoaderResult {
  const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

  return data;
}
