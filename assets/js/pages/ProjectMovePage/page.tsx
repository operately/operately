import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { SpaceCardGrid, SpaceCardOption } from "@/components/SpaceCards";

export function Page() {
  const { project, groups } = useLoadedData();

  const candidateSpaces = groups.filter((group) => group.id !== project.group_id);

  return (
    <Pages.Page title={["Move to another space", project.name]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

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

function MoveToSpace({ project, candidateSpaces }) {
  return (
    <>
      <div className="uppercase text-content-dimmed text-sm font-medium mt-8 mb-4 tracking-wide text-center">
        Select a space
      </div>

      <SpaceCardGrid>
        {candidateSpaces.map((group) => (
          <SpaceCardOption key={group.id} group={group} />
        ))}
      </SpaceCardGrid>
    </>
  );
}
