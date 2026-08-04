interface FinishFirstItemOnboardingOptions {
  invalidateWorkMapCache: () => void;
  navigateToItem: () => void | Promise<void>;
}

export function finishFirstItemOnboarding({
  invalidateWorkMapCache,
  navigateToItem,
}: FinishFirstItemOnboardingOptions): void | Promise<void> {
  invalidateWorkMapCache();
  return navigateToItem();
}
