import Api from "@/api";

export function useProductRelease() {
  const { data } = Api.product_releases.useGetLatest({});

  return data?.productRelease ?? null;
}
