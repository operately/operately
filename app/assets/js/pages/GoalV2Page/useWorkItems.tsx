import React from "react";

import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

import { compareIds, DeprecatedPaths } from "@/routes/paths";

import { assertPresent } from "@/utils/assertions";
import { MiniWorkMap } from "turboui";
import { useLoadedData } from "./loader";

export function useWorkItems(): MiniWorkMap.WorkItem[] {
  const { goal, goals, projects } = useLoadedData();

  const items: MiniWorkMap.WorkItem[] = React.useMemo(() => {
    const projectAsWorkItem = (project: Projects.Project) => {
      assertPresent(project.id, "project id must be present");
      assertPresent(project.name, "project name must be present");

      return {
        id: project.id!,
        type: "project" as const,
        state: project.closedAt ? "closed" : project.status === "paused" ? "paused" : "active",
        status: project.lastCheckIn?.status || "pending",
        name: project.name,
        itemPath: DeprecatedPaths.projectPath(project.id),
        progress: Projects.getProgress(project),
        completed: Projects.isClosed(project),
        assignees: Projects.getPeople(project),
        children: [],
      } as MiniWorkMap.WorkItem;
    };

    const goalAsWorkItem = (goal: Goals.Goal) => {
      assertPresent(goal.id, "goal id must be present");
      assertPresent(goal.name, "goal name must be present");
      assertPresent(goal.isClosed, "goal closed status must be present");
      assertPresent(goal.progressPercentage, "goal progress percentage must be present");

      return {
        id: goal.id,
        type: "goal",
        state: goal.closedAt ? "closed" : "active",
        status: goal.lastCheckIn?.status || "pending",
        name: goal.name,
        itemPath: DeprecatedPaths.goalPath(goal.id),
        progress: goal.progressPercentage,
        completed: goal.isClosed,
        assignees: Goals.getPeople(goal),
        children: subItems(goal),
      } as MiniWorkMap.WorkItem;
    };

    const subItems = (goal: Goals.Goal) => {
      const subGoals = goals.filter((g) => compareIds(g.parentGoalId, goal.id)).map((g) => goalAsWorkItem(g));
      const goalProjects = projects.filter((p) => compareIds(p.goalId, goal.id)).map((p) => projectAsWorkItem(p));

      return [...subGoals, ...goalProjects];
    };

    return subItems(goal);
  }, [goal, goals, projects]);

  return items;
}
