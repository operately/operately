interface FinishFirstItemOnboardingOptions {
  navigateToItem: () => void | Promise<void>;
  markSetupComplete: () => Promise<unknown>;
  reportError: (error: unknown) => void;
}

export function finishFirstItemOnboarding({
  navigateToItem,
  markSetupComplete,
  reportError,
}: FinishFirstItemOnboardingOptions): void | Promise<void> {
  const navigation = navigateToItem();
  void markSetupComplete().catch(reportError);

  return navigation;
}
