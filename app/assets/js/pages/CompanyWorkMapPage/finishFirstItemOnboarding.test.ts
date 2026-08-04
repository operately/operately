import { finishFirstItemOnboarding } from "./finishFirstItemOnboarding";

describe("finishFirstItemOnboarding", () => {
  it("invalidates the empty Work Map cache before navigating", () => {
    const setupCompletion = new Promise<void>(() => {});
    const navigation = new Promise<void>(() => {});
    const callOrder: string[] = [];
    const invalidateWorkMapCache = jest.fn(() => callOrder.push("invalidate"));
    const navigateToItem = jest.fn(() => {
      callOrder.push("navigate");
      return navigation;
    });
    const markSetupComplete = jest.fn(() => setupCompletion);

    const result = finishFirstItemOnboarding({
      invalidateWorkMapCache,
      navigateToItem,
      markSetupComplete,
      reportError: jest.fn(),
    });

    expect(result).toBe(navigation);
    expect(invalidateWorkMapCache).toHaveBeenCalledTimes(1);
    expect(navigateToItem).toHaveBeenCalledTimes(1);
    expect(markSetupComplete).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["invalidate", "navigate"]);
  });

  it("reports setup completion errors after navigating", async () => {
    const error = new Error("setup failed");
    const navigateToItem = jest.fn();
    const reportError = jest.fn();

    finishFirstItemOnboarding({
      invalidateWorkMapCache: jest.fn(),
      navigateToItem,
      markSetupComplete: () => Promise.reject(error),
      reportError,
    });

    expect(navigateToItem).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    expect(reportError).toHaveBeenCalledWith(error);
  });
});
