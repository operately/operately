import { shouldShowFirstProjectOnboarding } from "./firstProjectOnboarding";

describe("shouldShowFirstProjectOnboarding", () => {
  it("shows the first-project state to an owner of an unfinished empty company", () => {
    expect(
      shouldShowFirstProjectOnboarding({
        isOwner: true,
        setupCompleted: false,
        hasWorkItems: false,
        canAddItem: true,
      }),
    ).toBe(true);
  });

  it("does not show company onboarding to a non-owner", () => {
    expect(
      shouldShowFirstProjectOnboarding({
        isOwner: false,
        setupCompleted: false,
        hasWorkItems: false,
        canAddItem: true,
      }),
    ).toBe(false);
  });
});
