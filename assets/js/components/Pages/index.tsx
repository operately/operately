export { Page } from "./Page";

export { useRefresh } from "./useRefresh";
export { useLoadedData } from "./useLoadedData";

export const emptyLoader = () => Promise.resolve(null);

export function getSearchParam(request: Request, key: string): string | null {
  return new URL(request.url).searchParams.get(key);
}
