import { finishFirstItemOnboarding } from "./finishFirstItemOnboarding";

describe("finishFirstItemOnboarding", () => {
  it("invalidates the empty Work Map cache before navigating", () => {
    const navigation = new Promise<void>(() => {});
    const callOrder: string[] = [];
    const invalidateWorkMapCache = jest.fn(() => callOrder.push("invalidate"));
    const navigateToItem = jest.fn(() => {
      callOrder.push("navigate");
      return navigation;
    });

    const result = finishFirstItemOnboarding({
      invalidateWorkMapCache,
      navigateToItem,
    });

    expect(result).toBe(navigation);
    expect(invalidateWorkMapCache).toHaveBeenCalledTimes(1);
    expect(navigateToItem).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["invalidate", "navigate"]);
  });
});
