import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";
import { useFormState } from "./useForm";

import { ProjectMilestonesNavigation } from "@/components/ProjectPageNavigation";
import { Title } from "./Title";
import { Overview } from "./Overview";
import { Description } from "./Description";
import { Comments } from "./Comments";

export function Page() {
  const { project, milestone, me } = useLoadedData();

  const form = useFormState(project, milestone);

  return (
    <Pages.Page title={[milestone.title, project.name]}>
      <Paper.Root size="medium">
        <ProjectMilestonesNavigation project={project} />

        <Paper.Body minHeight="none">
          <Title milestone={milestone} form={form} />
          <Overview milestone={milestone} form={form} />
          <Description milestone={milestone} form={form} />
          <Comments milestone={milestone} me={me} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
