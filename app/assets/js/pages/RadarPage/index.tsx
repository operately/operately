import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

import { GoalsAndProjects } from "@/features/SpaceTools/GoalsAndProjects";

interface Space {
  name: string;
  id: string;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

interface LoaderResult {
  spaces: { [key: string]: Space };
}

export async function loader(): Promise<LoaderResult> {
  const [goals, projects] = await Promise.all([
    Goals.getGoals({
      includeTargets: true,
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeReviewer: true,
    }).then((data) => data.goals!),
    Projects.getProjects({
      includeGoal: true,
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeMilestones: true,
      includePrivacy: true,
      includeReviewer: true,
      includeContributors: true,
      includeRetrospective: true,
    }).then((data) => data.projects!),
  ]);

  let spaces: { [key: string]: Space } = {};

  goals.forEach((goal) => {
    if (!spaces[goal.space!.id!]) {
      spaces[goal.space!.id!] = { id: goal.space!.id!, name: goal.space!.name!, goals: [], projects: [] };
    }

    spaces[goal.space!.id!]!.goals.push(goal);
  });

  projects.forEach((project) => {
    if (!spaces[project.space!.id!]) {
      spaces[project.space!.id!] = { id: project.space!.id!, name: project.space!.name!, goals: [], projects: [] };
    }

    spaces[project.space!.id!]!.projects.push(project);
  });

  return { spaces };
}

export function Page() {
  const { spaces } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={"Radar"}>
      <Paper.Root size="xlarge">
        <Paper.Body>
          <div className="text-3xl font-extrabold">Radar</div>
          <div className="mt-1">Get a bird's eye view of progress in the company</div>

          <div className="-mx-12 border-t border-surface-outline my-6" />

          <div className="mt-8">
            <div className="flex justify-center items-start flex-wrap gap-4">
              {Object.values(spaces)
                .filter((s) => s.name === "Company")
                .map((space) => (
                  <GoalsAndProjects title={space.name} space={space} goals={space.goals} projects={space.projects} />
                ))}
            </div>
          </div>

          <div className="h-6 border-l w-0.5 bg-surface-outline mx-auto" />
          <div className="border-t border-x border-surface-outline h-6 mx-[160px]" />
          <div className="h-6 border-l w-0.5 bg-surface-outline mx-auto -mt-6" />

          <div className="">
            <div className="flex justify-center items-start flex-wrap gap-4">
              {Object.values(spaces)
                .filter((s) => s.name !== "Company")
                .map((space) => (
                  <GoalsAndProjects title={space.name} space={space} goals={space.goals} projects={space.projects} />
                ))}
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
