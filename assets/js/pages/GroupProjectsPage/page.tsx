import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/models/projects";
import * as UpdateContent from "@/graphql/Projects/update_content";

import { Table } from "./Table";

import { GhostButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";

import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import { ProjectListItem } from "@/features/ProjectListItem";
import { Indicator } from "@/components/ProjectHealthIndicators";
import FormattedTime from "@/components/FormattedTime";
import { ButtonLink, Link } from "@/components/Link";

export function Page() {
  const { group, projects } = useLoadedData();
  const newProjectPath = createPath("spaces", group.id, "projects", "new");

  const [view, setView] = React.useState<"list" | "healthMap">("list");

  return (
    <Pages.Page title={group.name}>
      <Paper.Root size="large" fluid>
        <Paper.Body minHeight="500px" backgroundColor="bg-surface">
          <GroupPageNavigation group={group} activeTab="projects" />

          <div className="flex items-center justify-between mb-8">
            <div className="font-extrabold text-3xl">Projects</div>
            <GhostButton type="primary" testId="add-project" size="sm" linkTo={newProjectPath}>
              Add Project
            </GhostButton>
          </div>

          <div className="flex items-center my-4 gap-2">
            <ButtonLink onClick={() => setView("list")}>List</ButtonLink>
            <ButtonLink onClick={() => setView("healthMap")}>Health Map</ButtonLink>
          </div>

          <div>{view === "list" && <ProjectList projects={projects} />}</div>
          <div>{view === "healthMap" && <HealthMap projects={projects} />}</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProjectList({ projects }: { projects: Projects.Project[] }) {
  const activeProjects = projects.filter((project) => !project.isArchived);
  const sortedProjects = Projects.sortByName(activeProjects);

  return (
    <div className="">
      {sortedProjects.map((project) => (
        <div key={project.id} className="py-4 bg-surface flex flex-col border-t last:border-b border-stroke-base">
          <ProjectListItem project={project} key={project.id} avatarPosition="right" />
        </div>
      ))}
    </div>
  );
}

function HealthMap({ projects }: { projects: Projects.Project[] }) {
  const columnSizes = [400, 220, 220, 220, 220, 220, 220];
  const headers = ["Project", "Status", "Schedule", "Team", "Budget", "Risks", "Last Check-In"];
  const sortedProjects = Projects.sortByName(projects);

  const rows = sortedProjects.map((project) => {
    const lastCheckIn = project.lastCheckIn;
    const projectLink = (
      <span className="font-medium">
        <Link to={createPath("projects", project.id)}>{project.name}</Link>
      </span>
    );

    if (lastCheckIn?.content) {
      const content = lastCheckIn.content as UpdateContent.StatusUpdate;

      return [
        projectLink,
        <Indicator value={project.health} type="status" />,
        <Indicator value={content.health.schedule} type="schedule" />,
        <Indicator value={content.health.team} type="team" />,
        <Indicator value={content.health.budget} type="budget" />,
        <Indicator value={content.health.risks} type="risks" />,
        <div>
          <FormattedTime time={lastCheckIn.insertedAt} format="relative" />
        </div>,
      ];
    } else {
      return [projectLink, "Unknown", "Unknown", "Unknown", "Unknown", "Unknown", "Never"];
    }
  });

  return <Table headers={headers} rows={rows} columnSizes={columnSizes} cellPadding="px-2 py-1.5" />;
}
