import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { useForm, Form } from "@/features/ProjectRetrospectiveForm";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";

export function Page() {
  const { project } = useLoadedData();
  const form = useForm({ project, mode: "create" });

  return (
    <Pages.Page title={"Closing " + project.name}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />
        <Paper.Body minHeight="none">
          <div className="uppercase text-content-accent text-sm">CLOSING THE PROJECT</div>
          <div className="text-content-accent text-3xl font-extrabold mb-8">Fill in the retrospective</div>

          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
