import { useLoaderData } from "react-router-dom";
import { usePeekLoaderData } from "@/layouts/CompanyLayout/PeekWindow";

export function useLoadedData<T = any>(): T {
  const data = useLoaderData() as T;
  const peek = usePeekLoaderData() as T;

  if (peek) {
    return peek;
  } else {
    return data;
  }
}
