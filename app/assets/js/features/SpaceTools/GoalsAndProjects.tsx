import React, { useState, useEffect } from "react";

import { Space } from "@/models/spaces";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Paths } from "@/routes/paths";
import { Container } from "./components";
import { ZeroState } from "./GoalsAndProjects/ZeroState";
import { AllDoneState } from "./GoalsAndProjects/AllDoneState";
import { RegularState } from "./GoalsAndProjects/RegularState";
import { match } from "ts-pattern";
import { hasFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";
import { useParams } from "react-router-dom";

interface Props {
  title: string;
  space: Space;
  goals: Goal[];
  projects: Project[];
}

export function GoalsAndProjects(props: Props) {
  const params = useParams();
  const [isSpaceWorkMapEnabled, setIsSpaceWorkMapEnabled] = useState(false);

  useEffect(() => {
    if (params.companyId) {
      hasFeatureEnabled(params.companyId, "space_work_map")
        .then((enabled) => setIsSpaceWorkMapEnabled(enabled || false))
        .catch(() => setIsSpaceWorkMapEnabled(false));
    }
  }, [params.companyId]);

  const path = isSpaceWorkMapEnabled ? Paths.spaceWorkMapPath(props.space.id!) : Paths.spaceGoalsPath(props.space.id!);
  const state = calculateState(props.goals, props.projects);

  return (
    <Container path={path} testId="goals-and-projects">
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
