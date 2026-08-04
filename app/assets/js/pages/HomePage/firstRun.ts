interface FirstRunState {
  isOwner: boolean;
  setupCompleted: boolean;
  hasWorkItems: boolean;
}

export function shouldOpenCompanyWorkMap({ isOwner, setupCompleted, hasWorkItems }: FirstRunState): boolean {
  return isOwner && !setupCompleted && !hasWorkItems;
}
