import { isMilestoneOverdue, Milestone } from "./index";

import * as Time from "../../utils/time";

describe(".isMilestoneOverdue", () => {
  it("the deadline is today", () => {
    const milestone = { deadlineAt: Time.today() } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("the deadline was 10 days ago", () => {
    const milestone = { deadlineAt: Time.daysAgo(10) } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(true);
  });

  it("the deadline is in 10 days", () => {
    const milestone = { deadlineAt: Time.daysFromNow(10) } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(false);
  });
});
