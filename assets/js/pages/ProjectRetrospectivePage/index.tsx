import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { AvatarWithName } from "@/components/Avatar/AvatarWithName";

import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";

interface LoaderResult {
  retrospective: Projects.ProjectRetrospective;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    retrospective: await Projects.getProjectRetrospective({
      projectId: params.projectID,
      includeAuthor: true,
      includeProject: true,
    }).then((data) => data.retrospective!),
  };
}

export function Page() {
  const { retrospective } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["Retrospective", retrospective.project!.name!]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={retrospective.project!} />

        <Paper.Body minHeight="none">
          <div className="text-center text-content-accent text-3xl font-extrabold">Project Retrospective</div>
          <div className="flex items-center gap-2 font-medium justify-center mt-2">
            {retrospective.author && <AvatarWithName person={retrospective.author} size={16} />}
            {retrospective.author && <span>&middot;</span>}
            <FormattedTime time={retrospective.closedAt!} format="long-date" />
          </div>
          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content() {
  const { retrospective } = Pages.useLoadedData<LoaderResult>();
  const retro = JSON.parse(retrospective.content!);

  return (
    <div className="mt-8">
      <div className="text-content-accent font-bold mt-4 pt-4 border-t border-stroke-base">What went well?</div>
      <RichContent jsonContent={JSON.stringify(retro.whatWentWell)} />

      <div className="text-content-accent font-bold mt-4 pt-4 border-t border-stroke-base">
        What could've gone better?
      </div>
      <RichContent jsonContent={JSON.stringify(retro.whatCouldHaveGoneBetter)} />

      <div className="text-content-accent font-bold mt-4 pt-4 border-t border-stroke-base">What did you learn?</div>
      <RichContent jsonContent={JSON.stringify(retro.whatDidYouLearn)} />
    </div>
  );
}
