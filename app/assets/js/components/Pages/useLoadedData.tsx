import { useLoaderData } from "react-router";

export function useLoadedData<T = any>(): T {
  return useLoaderData() as T;
}
