import { useLoaderData } from "react-router-dom";

export function useLoadedData<T = any>(): T {
  return useLoaderData() as T;
}
