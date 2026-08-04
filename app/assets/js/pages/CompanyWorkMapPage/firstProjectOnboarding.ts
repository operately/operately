interface FirstProjectOnboardingState {
  isOwner: boolean;
  setupCompleted: boolean;
  hasWorkItems: boolean;
  canAddItem: boolean;
}

export function shouldShowFirstProjectOnboarding({
  isOwner,
  setupCompleted,
  hasWorkItems,
  canAddItem,
}: FirstProjectOnboardingState): boolean {
  return isOwner && !setupCompleted && !hasWorkItems && canAddItem;
}
