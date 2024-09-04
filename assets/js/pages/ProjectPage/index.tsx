import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import { Banner } from "./Banner";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { ProjectFeed } from "./ProjectFeed";
import { CheckInSection } from "./CheckInSection";
import { StatusOverview } from "./StatusOverview";
import { TimelineSection } from "./TimelineSection";
import { ResourcesSection } from "./ResourcesSection";
import { ProjectDescriptionSection } from "./ProjectDescriptionSection";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.id,
      includeSpace: true,
      includeGoal: true,
      includeChampion: true,
      includePermissions: true,
      includeContributors: true,
      includeKeyResources: true,
      includeMilestones: true,
      includeLastCheckIn: true,
      includePrivacy: true,
    }).then((data) => data.project!),
  };
}

export function Page() {
  const { project } = Pages.useLoadedData() as LoaderResult;

  return (
    <Pages.Page title={project.name!}>
      <Paper.Root size="large">
        <Navigation space={project.space!} />

        <Paper.Body>
          <Banner project={project} />
          <Header project={project} />

          <div className="mt-4">
            <StatusOverview project={project} />
            <ProjectDescriptionSection project={project} />
            <TimelineSection project={project} />
            <CheckInSection project={project} />
            <ResourcesSection project={project} />
          </div>

          <ProjectFeed project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
