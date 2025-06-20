import React from "react";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Space } from "@/models/spaces";
import { match } from "ts-pattern";
import { Container } from "./components";
import { AllDoneState } from "./GoalsAndProjects/AllDoneState";
import { RegularState } from "./GoalsAndProjects/RegularState";
import { ZeroState } from "./GoalsAndProjects/ZeroState";

import { usePaths } from "@/routes/paths";
interface Props {
  title: string;
  space: Space;
  goals: Goal[];
  projects: Project[];
}

export function GoalsAndProjects(props: Props) {
  const paths = usePaths();
  const state = calculateState(props.goals, props.projects);

  return (
    <Container path={paths.spaceWorkMapPath(props.space.id!)} testId="goals-and-projects">
      {match(state)
        .with("zero", () => <ZeroState />)
        .with("all-done", () => <AllDoneState {...props} />)
        .with("regular", () => <RegularState {...props} />)
        .run()}
    </Container>
  );
}

function calculateState(goals: Goal[], projects: Project[]): "zero" | "regular" | "all-done" {
  const allGoalsClosed = goals.every((g) => g.closedAt);
  const allProjectsClosed = projects.every((p) => p.status === "closed");

  if (goals.length === 0 && projects.length === 0) {
    return "zero";
  } else if (allGoalsClosed && allProjectsClosed) {
    return "all-done";
  } else {
    return "regular";
  }
}
