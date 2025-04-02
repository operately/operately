import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { compareIds } from "@/routes/paths";

export function findGoalChildren(goal: Goal, goals: Goal[], projects: Project[]) {
  const childGoals = goals.filter((g) => compareIds(g.parentGoalId, goal.id));
  const childProjects = projects.filter((p) => compareIds(p.goalId, goal.id));

  return [...childGoals, ...childProjects];
}
