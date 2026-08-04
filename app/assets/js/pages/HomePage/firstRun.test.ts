import { shouldOpenCompanyWorkMap } from "./firstRun";

describe("shouldOpenCompanyWorkMap", () => {
  it("opens the Work Map for an owner whose setup and work are both empty", () => {
    expect(
      shouldOpenCompanyWorkMap({
        isOwner: true,
        setupCompleted: false,
        hasWorkItems: false,
      }),
    ).toBe(true);
  });

  it("keeps established and non-owner companies on Home", () => {
    expect(
      shouldOpenCompanyWorkMap({
        isOwner: true,
        setupCompleted: false,
        hasWorkItems: true,
      }),
    ).toBe(false);
    expect(
      shouldOpenCompanyWorkMap({
        isOwner: true,
        setupCompleted: true,
        hasWorkItems: false,
      }),
    ).toBe(false);
    expect(
      shouldOpenCompanyWorkMap({
        isOwner: false,
        setupCompleted: false,
        hasWorkItems: false,
      }),
    ).toBe(false);
  });
});
