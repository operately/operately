import * as Routes from "@/routes/hooks";

export function useLoadedData<T = any>(): T {
  return Routes.useLoadedData() as T;
}
