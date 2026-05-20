import { isCheckInOverdue } from "./checkInOverdue";

describe("isCheckInOverdue", () => {
  const today = new Date(2026, 4, 20, 12, 0, 0);

  it("is true when the next check-in was scheduled before today", () => {
    expect(isCheckInOverdue(new Date(2026, 4, 19, 23, 59, 0), "active", today)).toBe(true);
  });

  it("is false when the next check-in is scheduled today", () => {
    expect(isCheckInOverdue(new Date(2026, 4, 20, 0, 0, 0), "active", today)).toBe(false);
  });

  it("is false when the next check-in is scheduled in the future", () => {
    expect(isCheckInOverdue(new Date(2026, 4, 21, 0, 0, 0), "active", today)).toBe(false);
  });

  it("is false for inactive projects", () => {
    expect(isCheckInOverdue(new Date(2026, 4, 19, 0, 0, 0), "paused", today)).toBe(false);
    expect(isCheckInOverdue(new Date(2026, 4, 19, 0, 0, 0), "closed", today)).toBe(false);
  });

  it("is false when no check-in is scheduled", () => {
    expect(isCheckInOverdue(null, "active", today)).toBe(false);
  });
});
