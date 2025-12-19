import React from "react";

import { Task } from "@/models/tasks";
import { Space } from "@/models/spaces";
import { Container } from "./components";
import { RegularState } from "./Tasks/RegularState";
import { ZeroState } from "./Tasks/ZeroState";

import { usePaths } from "@/routes/paths";

interface Props {
  space: Space;
  tasks: Task[];
}

export function Tasks(props: Props) {
  const paths = usePaths();
  const path = paths.spaceKanbanPath(props.space.id!);
  const isZeroState = props.tasks.length < 1;

  return <Container path={path} testId="tasks-tool">{isZeroState ? <ZeroState /> : <RegularState {...props} />}</Container>;
}
