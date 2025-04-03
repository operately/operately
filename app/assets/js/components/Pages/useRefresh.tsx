import { useRevalidator } from "react-router-dom";

export function useRefresh() {
  const { revalidate } = useRevalidator();

  return revalidate;
}
