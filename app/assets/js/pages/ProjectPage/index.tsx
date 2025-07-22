import * as Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";
import * as Projects from "@/models/projects";
import * as React from "react";

import { useClearNotificationsOnLoad } from "@/features/notifications";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { fetchAll } from "../../utils/async";
import { banner } from "./Banner";
import { CheckInSection } from "./CheckInSection";
import { ContributorsSection } from "./ContributorsSection";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { ProjectDescriptionSection } from "./ProjectDescriptionSection";
import { ProjectDiscussionsSection } from "./ProjectDiscussionsSection";
import { ProjectFeed } from "./ProjectFeed";
import { ProjectOptions } from "./ProjectOptions";
import { ResourcesSection } from "./ResourcesSection";
import { StatusOverview } from "./StatusOverview";
import { TimelineSection } from "./TimelineSection";

export default { name: "ProjectPage", loader, Page } as PageModule;

interface LoaderResult {
  project: Projects.Project;
  company: Companies.Company;
}

async function loader({ params }): Promise<LoaderResult> {
  return fetchAll({
    company: Companies.getCompany({
      id: params.companyId,
    }).then((d) => d.company!),
    project: Projects.getProject({
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
    discussions: Api.projectDiscussions.list({
      projectId: params.id,
    }),
  });
}

function Page() {
  const { project, company } = Pages.useLoadedData() as LoaderResult;

  assertPresent(project.notifications, "Project notifications must be defined");
  useClearNotificationsOnLoad(project.notifications);

  return (
    <Pages.Page title={project.name!} testId="project-page">
      <Paper.Root size="large">
        <Navigation space={project.space!} />

        <Paper.Body banner={banner(project)}>
          <Header project={project} />
          <ContributorsSection project={project} />

          <div className="mt-4">
            <ProjectOptions project={project} />
            <StatusOverview project={project} />
            <ProjectDescriptionSection project={project} />
            <TimelineSection project={project} />
            <CheckInSection project={project} />
            {Companies.hasFeature(company, "project_discussions") && <ProjectDiscussionsSection project={project} />}
            <ResourcesSection project={project} />
          </div>

          <ProjectFeed project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
