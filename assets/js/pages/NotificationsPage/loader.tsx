import * as Paper from "@/components/PaperContainer";

export interface LoaderResult {
}

export async function loader({params}) : Promise<LoaderResult> {
  // TODO: Implement

  return {}
}

export function useLoadedData() : LoaderResult {
  const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

  return data;
}
