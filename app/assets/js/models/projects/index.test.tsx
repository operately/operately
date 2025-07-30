import { isMilestoneOverdue, Milestone } from "./index";

import * as Time from "../../utils/time";

function getCustomMilestone(date, status) {
  return {
    status,
    timeframe: {
      contextualEndDate: {
        date,
      },
    },
  } as Pick<Milestone, "status" | "timeframe">;
}

describe(".isMilestoneOverdue", () => {
  it("the deadline is today", () => {
    const date = Time.today().toISOString().split('T')[0];
    const milestone = getCustomMilestone(date, "pending");

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("the deadline was 10 days ago", () => {
    const date = Time.daysAgo(10).toISOString().split('T')[0];
    const milestone = getCustomMilestone(date, "pending");

    expect(isMilestoneOverdue(milestone)).toBe(true);
  });

  it("the deadline is in 10 days", () => {
    const date = Time.daysFromNow(10).toISOString().split('T')[0];
    const milestone = getCustomMilestone(date, "pending")
    
    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("done milestone", () => {
    const date = Time.daysAgo(10).toISOString().split('T')[0];
    const milestone = getCustomMilestone(date, "done");

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("no status", () => {
    const date = Time.daysAgo(10).toISOString().split('T')[0];
    const milestone = getCustomMilestone(date, undefined);

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("no timeframe", () => {
    const milestone = getCustomMilestone(undefined, "pending");

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });
});
