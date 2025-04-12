import React from "react";

import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

import { compareIds, Paths } from "@/routes/paths";

import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";
import { MiniWorkMap } from "turboui";

export function useWorkItems() : MiniWorkMap.WorkItem[] {
  const { goal, goals, projects } = useLoadedData();

  const items = React.useMemo(() => {
    const projectAsWorkItem = (project: Projects.Project) => {
      assertPresent(project.id, "project id must be present");
      assertPresent(project.name, "project name must be present");

      return {
        id: project.id,
        type: "project" as const,
        status: project.lastCheckIn?.status || "pending",
        name: project.name,
        link: Paths.projectPath(project.id),
        progress: Projects.getProgress(project),
        completed: Projects.isClosed(project),
        people: Projects.getPeople(project),
        subitems: [],
      }
    };

    const goalToWorkItem = (goal: Goals.Goal) => {
      const subgoals = goals.filter(g => compareIds(g.parentGoalId, goal.id));
      const goalProjects = projects.filter(p => compareIds(p.goalId, goal.id)).map(projectAsWorkItem);

      assertPresent(goal.id, "goal id must be present");
      assertPresent(goal.name, "goal name must be present");
      assertPresent(goal.isClosed, "goal closed status must be present");
      assertPresent(goal.progressPercentage, "goal progress percentage must be present");

      return {
        id: goal.id,
        type: "goal",
        status: goal.lastCheckIn?.status || "pending",
        name: goal.name,
        link: Paths.goalPath(goal.id),
        progress: goal.progressPercentage,
        completed: goal.isClosed,
        people: Goals.getPeople(goal),
        subitems: [
          ...subgoals.map(goalToWorkItem),
          ...goalProjects,
        ],
      };
    };

    return [goalToWorkItem(goal)];
  }, [goal, goals, projects]);

  return items;
}
