import * as Routes from "@/routes/Routes";

export function useLoadedData<T = any>(): T {
  return Routes.useLoadedData() as T;
}
