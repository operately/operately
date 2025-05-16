import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as React from "react";

import { useClearNotificationsOnLoad } from "@/features/notifications";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import * as Turboui from "turboui";
import { CheckInSection } from "./CheckInSection";
import { ContributorsSection } from "./ContributorsSection";
import { Header } from "./Header";
import { ProjectDescriptionSection } from "./ProjectDescriptionSection";
import { ProjectFeed } from "./ProjectFeed";
import { ResourcesSection } from "./ResourcesSection";
import { StatusOverview } from "./StatusOverview";
import { TimelineSection } from "./TimelineSection";

export default { name: "ProjectPage", loader, Page } as PageModule;

interface LoaderResult {
  project: Projects.Project;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.id,
      includeSpace: true,
      includeGoal: true,
      includeChampion: true,
      includeReviewer: true,
      includePermissions: true,
      includeContributors: true,
      includeKeyResources: true,
      includeMilestones: true,
      includeLastCheckIn: true,
      includePrivacy: true,
      includeRetrospective: true,
      includeUnreadNotifications: true,
    }).then((data) => data.project!),
  };
}

function Page() {
  const { project } = Pages.useLoadedData() as LoaderResult;

  assertPresent(project.notifications, "Project notifications must be defined");
  useClearNotificationsOnLoad(project.notifications);

  const navigation = [
    { label: "Home", to: "/" },
    { label: project.space!.name!, to: "/" },
    { label: project.name!, to: "/" },
  ];

  return (
    <Turboui.Page title={[project.name!]} navigation={navigation}>
      <div className="py-4 lg:py-20">
        <Header project={project} />
        <ContributorsSection project={project} />

        <div className="mt-4">
          <StatusOverview project={project} />
          <ProjectDescriptionSection project={project} />
          <TimelineSection project={project} />
          <CheckInSection project={project} />
          <ResourcesSection project={project} />
        </div>

        <ProjectFeed project={project} />
      </div>
    </Turboui.Page>
  );
}
