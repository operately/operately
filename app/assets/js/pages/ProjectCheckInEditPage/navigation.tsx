import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { ProjectCheckIn } from "@/models/projectCheckIns";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { usePaths } from "@/routes/paths";

export function buildProjectCheckInEditNavigation(
  checkIn: ProjectCheckIn,
  paths: Paths,
): Paper.NavigationItem[] {
  const items: Paper.NavigationItem[] = [];

  if (checkIn.space) {
    items.push({ to: paths.spacePath(checkIn.space.id), label: checkIn.space.name });
    items.push({ to: paths.spaceWorkMapPath(checkIn.space.id, "projects" as const), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("projects"), label: "Work Map" });
  }

  const project = checkIn.project;
  assertPresent(project, "Check-in project must be defined");
  items.push({ to: paths.projectPath(project.id), label: project.name });
  items.push({ to: paths.projectCheckInsPath(project.id), label: "Check-Ins" });

  return items;
}

export function Navigation() {
  const paths = usePaths();
  const { checkIn } = useLoadedData();

  return <Paper.Navigation items={buildProjectCheckInEditNavigation(checkIn, paths)} />;
}
