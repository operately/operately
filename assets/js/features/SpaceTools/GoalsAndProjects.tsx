import React from "react";

import { Space } from "@/models/spaces";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Paths } from "@/routes/paths";
import { Container } from "./components";
import { ZeroState } from "./GoalsAndProjects/ZeroState";
import { RegularState } from "./GoalsAndProjects/RegularState";

interface Props {
  title: string;
  space: Space;
  goals: Goal[];
  projects: Project[];
}

export function GoalsAndProjects(props: Props) {
  const path = Paths.spaceGoalsPath(props.space.id!);
  const isZeroState = props.goals.length < 1 && props.projects.length < 1;

  return (
    <Container path={path} testId="goals-and-projects">
      {isZeroState ? <ZeroState /> : <RegularState {...props} />}
    </Container>
  );
}
