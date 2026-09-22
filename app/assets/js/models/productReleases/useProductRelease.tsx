import Api, { type ProductRelease } from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useProductRelease(): ProductRelease | null {
  const { data } = useQuery(Api.product_releases.getLatestQueryOptions({}));

  return data?.productRelease ?? null;
}
