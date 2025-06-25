import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ProjectRetrospectiveNavigation } from "@/components/ProjectPageNavigation";
import { useLoadedData } from "./loader";

export function Page() {
  const { retrospective } = useLoadedData();

  return (
    <Pages.Page title="Editing Retrospective">
      <Paper.Root size="small">
        <ProjectRetrospectiveNavigation project={retrospective.project} />
        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold mb-8">Editing retrospective</div>

        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
