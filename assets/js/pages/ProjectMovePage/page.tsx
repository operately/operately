import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import * as Projects from "@/graphql/Projects";
import * as Groups from "@/graphql/Groups";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";
import { SpaceCardGrid, SpaceCard } from "@/components/SpaceCards";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";

export function Page() {
  const { project, groups } = useLoadedData();

  const candidateSpaces = groups.filter((group) => group.id !== project.spaceId);

  return (
    <Pages.Page title={["Move to another space", project.name]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold text-center">Moving to another space</div>

          {candidateSpaces.length === 0 ? (
            <NoOtherSpaces />
          ) : (
            <MoveToSpace project={project} candidateSpaces={candidateSpaces} />
          )}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function NoOtherSpaces() {
  return (
    <div className="uppercase text-content-dimmed text-sm font-medium mt-4 tracking-wide">
      There are no other spaces to move this project to
    </div>
  );
}

function MoveToSpace({ project, candidateSpaces }: { project: Projects.Project; candidateSpaces: Groups.Group[] }) {
  const gotoProject = useNavigateTo(`/projects/${project.id}`);

  const [move] = Projects.useMoveProjectToSpaceMutation({
    onCompleted: gotoProject,
  });

  const moveProjectToSpace = async (project: Projects.Project, group: Groups.Group) => {
    await move({
      variables: {
        input: {
          projectId: project.id,
          spaceId: group.id,
        },
      },
    });
  };

  return (
    <>
      <div className="uppercase text-content-dimmed text-sm font-medium mt-8 mb-4 tracking-wide text-center">
        Select a destination space
      </div>

      <SpaceCardGrid>
        {candidateSpaces.map((group) => (
          <SpaceCard
            key={group.id}
            group={group}
            testId={`space-${group.id}`}
            onClick={() => moveProjectToSpace(project, group)}
          />
        ))}
      </SpaceCardGrid>
    </>
  );
}
