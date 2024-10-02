import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ProjectRetrospectiveNavigation } from "@/components/ProjectPageNavigation";
import { useForm, Form } from "@/features/ProjectRetrospectiveForm";
import { useLoadedData } from "./loader";

export function Page() {
  const { retrospective } = useLoadedData();
  const form = useForm({ retrospective, project: retrospective.project!, mode: "edit" });

  return (
    <Pages.Page title="Editing Retrospective">
      <Paper.Root size="small">
        <ProjectRetrospectiveNavigation project={retrospective.project} />
        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold mb-8">Editing retrospective</div>

          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
