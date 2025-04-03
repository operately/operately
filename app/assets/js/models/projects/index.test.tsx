import { isMilestoneOverdue, Milestone } from "./index";

import * as Time from "../../utils/time";

describe(".isMilestoneOverdue", () => {
  it("the deadline is today", () => {
    const time = Time.toDateWithoutTime(Time.today());
    const milestone = { deadlineAt: time, status: "pending" } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("the deadline was 10 days ago", () => {
    const time = Time.toDateWithoutTime(Time.daysAgo(10));
    const milestone = { deadlineAt: time, status: "pending" } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(true);
  });

  it("the deadline is in 10 days", () => {
    const time = Time.toDateWithoutTime(Time.daysFromNow(10));
    const milestone = { deadlineAt: time, status: "pending" } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("done milestone", () => {
    const time = Time.toDateWithoutTime(Time.daysAgo(10));
    const milestone = { deadlineAt: time, status: "done" } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("no status", () => {
    const time = Time.toDateWithoutTime(Time.daysAgo(10));
    const milestone = { deadlineAt: time } as Milestone;
    expect(isMilestoneOverdue(milestone)).toBe(false);
  });
});
