import { useRevalidator } from "react-router";

export function useRefresh() {
  const { revalidate } = useRevalidator();

  return revalidate;
}
