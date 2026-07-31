import { isOverdue, isMilestoneOverdue, Milestone, Project } from "./index";

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

function getCustomProject(date) {
  return {
    timeframe: {
      contextualEndDate: {
        date,
      },
    },
  } as Pick<Project, "timeframe">;
}

describe(".isMilestoneOverdue", () => {
  it("the deadline is today", () => {
    const date = Time.today().toISOString().split("T")[0];
    const milestone = getCustomMilestone(date, "pending");

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("the deadline was 10 days ago", () => {
    const date = Time.daysAgo(10).toISOString().split("T")[0];
    const milestone = getCustomMilestone(date, "pending");

    expect(isMilestoneOverdue(milestone)).toBe(true);
  });

  it("the deadline is in 10 days", () => {
    const date = Time.daysFromNow(10).toISOString().split("T")[0];
    const milestone = getCustomMilestone(date, "pending");

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("done milestone", () => {
    const date = Time.daysAgo(10).toISOString().split("T")[0];
    const milestone = getCustomMilestone(date, "done");

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("no status", () => {
    const date = Time.daysAgo(10).toISOString().split("T")[0];
    const milestone = getCustomMilestone(date, undefined);

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });

  it("no timeframe", () => {
    const milestone = getCustomMilestone(undefined, "pending");

    expect(isMilestoneOverdue(milestone)).toBe(false);
  });
});

describe(".isOverdue", () => {
  it("the deadline is today", () => {
    const date = Time.today().toISOString().split("T")[0];
    const project = getCustomProject(date);

    expect(isOverdue(project)).toBe(false);
  });

  it("the deadline was 10 days ago", () => {
    const date = Time.daysAgo(10).toISOString().split("T")[0];
    const project = getCustomProject(date);

    expect(isOverdue(project)).toBe(true);
  });

  it("the deadline is in 10 days", () => {
    const date = Time.daysFromNow(10).toISOString().split("T")[0];
    const project = getCustomProject(date);

    expect(isOverdue(project)).toBe(false);
  });

  it("the deadline was yesterday", () => {
    const date = Time.daysAgo(1).toISOString().split("T")[0];
    const project = getCustomProject(date);

    expect(isOverdue(project)).toBe(true);
  });

  it("matches isMilestoneOverdue behavior for consistency", () => {
    // Test the same scenarios as isMilestoneOverdue to ensure consistency
    const todayStr = Time.today().toISOString().split("T")[0];
    const yesterdayStr = Time.daysAgo(1).toISOString().split("T")[0];
    const futureStr = Time.daysFromNow(10).toISOString().split("T")[0];

    const todayProject = getCustomProject(todayStr);
    const yesterdayProject = getCustomProject(yesterdayStr);
    const futureProject = getCustomProject(futureStr);

    const todayMilestone = getCustomMilestone(todayStr, "pending");
    const yesterdayMilestone = getCustomMilestone(yesterdayStr, "pending");
    const futureMilestone = getCustomMilestone(futureStr, "pending");

    // Both functions should return the same result for the same dates
    expect(isOverdue(todayProject)).toBe(isMilestoneOverdue(todayMilestone));
    expect(isOverdue(yesterdayProject)).toBe(isMilestoneOverdue(yesterdayMilestone));
    expect(isOverdue(futureProject)).toBe(isMilestoneOverdue(futureMilestone));

    // Specifically, deadline on today should NOT be overdue
    expect(isOverdue(todayProject)).toBe(false);
    expect(isMilestoneOverdue(todayMilestone)).toBe(false);
  });
});
