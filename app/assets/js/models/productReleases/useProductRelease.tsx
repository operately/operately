import Api, { type ProductRelease } from "@/api";
import { useQuery } from "@tanstack/react-query";

export function useProductRelease(): { productRelease: ProductRelease | null; canAnnounce: boolean } {
  const { data } = useQuery(Api.product_releases.getLatestQueryOptions({}));

  return { productRelease: data?.productRelease ?? null, canAnnounce: data?.canAnnounce ?? false };
}
