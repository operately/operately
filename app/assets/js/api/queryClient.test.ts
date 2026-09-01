import { queryClient } from "./queryClient";

describe("queryClient", () => {
  it("uses stale-while-revalidate defaults without retrying failed requests", () => {
    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: false,
    });
  });
});
