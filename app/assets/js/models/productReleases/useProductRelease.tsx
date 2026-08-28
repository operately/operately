import Api, { type ProductRelease } from "@/api";

export function useProductRelease(): ProductRelease | null {
  const { data } = Api.product_releases.useGetLatest({});

  return data?.productRelease ?? null;
}
