import React from "react";

import { useGetGoals } from "@/models/goals";
import { useGetProjects } from "@/models/projects";
import { Space } from "@/models/spaces";
import { Container, Title } from "./components";

export function GoalsAndProjects({ space }: { space: Space }) {
  const { data: goals } = useGetGoals({ spaceId: space.id });
  const { data: projects } = useGetProjects({ spaceId: space.id });

  console.log(goals);
  console.log(projects);

  return (
    <Container>
      <Title title="Goals & Projects" />
    </Container>
  );
}
