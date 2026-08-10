import React from "react";

import { ProjectTemplate } from "@/api";
import { Space } from "@/models/spaces";
import { SpaceTemplatesTool } from "turboui";

import { usePaths } from "@/routes/paths";
import { Container } from "./components";

interface Props {
  space: Space;
  templates: ProjectTemplate[];
}

export function Templates({ space, templates }: Props) {
  const paths = usePaths();

  return (
    <Container path={paths.spaceProjectTemplatesPath(space.id!)} testId="templates-tool">
      <SpaceTemplatesTool templates={templates} />
    </Container>
  );
}
