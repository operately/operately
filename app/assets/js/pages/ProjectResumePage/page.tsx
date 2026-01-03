import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

import { useLoadedData } from "./loader";

import { Form } from "./Form";

import { usePaths } from "@/routes/paths";
export function Page() {
  const paths = usePaths();
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Resume", project.name!]}>
      <Paper.Root size="medium">
        <Paper.Navigation items={[{ to: paths.projectPath(project.id!), label: project.name! }]} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Ready to resume project?</div>
          <div className="text-content text font-medium mt-2">
            Resuming will:
            <ul className="list-disc list-inside mt-4">
              <li>Reactivate project milestones and tasks</li>
              <li>Restart notifications for team members</li>
              <li>Make the project visible in active project lists</li>
            </ul>
          </div>

          <div className="mt-8">
            <Form project={project} />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
