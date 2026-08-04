interface FinishFirstItemOnboardingOptions {
  invalidateWorkMapCache: () => void;
  navigateToItem: () => void | Promise<void>;
  markSetupComplete: () => Promise<unknown>;
  reportError: (error: unknown) => void;
}

export function finishFirstItemOnboarding({
  invalidateWorkMapCache,
  navigateToItem,
  markSetupComplete,
  reportError,
}: FinishFirstItemOnboardingOptions): void | Promise<void> {
  invalidateWorkMapCache();
  const navigation = navigateToItem();
  void markSetupComplete().catch(reportError);

  return navigation;
}
