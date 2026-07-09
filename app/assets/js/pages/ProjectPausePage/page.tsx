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
    <Pages.Page title={["Pausing", project.name!]}>
      <Paper.Root size="medium">
        <Paper.Navigation items={[{ to: paths.projectPath(project.id!), label: project.name! }]} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Pause this project?</div>
          <div className="text-content text font-medium mt-2">
            Pausing this project will:
            <ul className="list-disc list-inside mt-4">
              <li>Suspend all associated milestones and tasks</li>
              <li>Stop notifications for team members</li>
              <li>Move the project to your paused projects list</li>
            </ul>
            <p className="mt-4">Note: You can resume the project at any time.</p>
          </div>

          <div className="mt-8">
            <Form project={project} />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
