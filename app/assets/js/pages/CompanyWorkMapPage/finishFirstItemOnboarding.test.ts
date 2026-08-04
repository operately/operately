import { finishFirstItemOnboarding } from "./finishFirstItemOnboarding";

describe("finishFirstItemOnboarding", () => {
  it("returns the navigation promise without waiting for setup completion", () => {
    const setupCompletion = new Promise<void>(() => {});
    const navigation = new Promise<void>(() => {});
    const navigateToItem = jest.fn(() => navigation);
    const markSetupComplete = jest.fn(() => setupCompletion);

    const result = finishFirstItemOnboarding({ navigateToItem, markSetupComplete, reportError: jest.fn() });

    expect(result).toBe(navigation);
    expect(navigateToItem).toHaveBeenCalledTimes(1);
    expect(markSetupComplete).toHaveBeenCalledTimes(1);
  });

  it("reports setup completion errors after navigating", async () => {
    const error = new Error("setup failed");
    const navigateToItem = jest.fn();
    const reportError = jest.fn();

    finishFirstItemOnboarding({
      navigateToItem,
      markSetupComplete: () => Promise.reject(error),
      reportError,
    });

    expect(navigateToItem).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    expect(reportError).toHaveBeenCalledWith(error);
  });
});
