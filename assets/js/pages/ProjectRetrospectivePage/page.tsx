import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import RichContent from "@/components/RichContent";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Retrospective", project.name]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Project Retrospective</div>
          <Content project={project} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content({ project }) {
  const retro = JSON.parse(project.retrospective);

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
