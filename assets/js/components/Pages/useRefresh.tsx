import { useRevalidator } from "@/routes/hooks";

export function useRefresh() {
  const { revalidate } = useRevalidator();

  return revalidate;
}
