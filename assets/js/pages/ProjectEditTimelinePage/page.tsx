import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { GhostButton } from "@/components/Button";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";

import { DateSelector } from "./DateSelector";
import { MilestoneList } from "./MilestoneList";
import { ProjectMilestonesNavigation } from "@/components/ProjectPageNavigation";

export function Page() {
  const { project } = useLoadedData();
  const form = useForm(project);

  return (
    <Pages.Page title={["Edit Project Timeline", project.name]}>
      <Paper.Root size="medium">
        <ProjectMilestonesNavigation project={project} />

        <Paper.Body minHeight="none">
          <h1 className="mb-12 font-extrabold text-content-accent text-3xl text-center">
            Editing the project timeline
          </h1>

          <div className="flex items-start gap-4">
            <StartDate form={form} />
            <DueDate form={form} />
          </div>

          <Section title="Milestones" />
          <MilestoneList form={form} />

          {form.hasChanges && (
            <>
              <div className="mt-12 flex items-center justify-center">
                <GhostButton type="primary" onClick={form.submit} testId="save">
                  Save timeline changes
                </GhostButton>
              </div>
            </>
          )}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Section({ title }) {
  return (
    <div className="mt-8 flex items-center gap-2">
      <div className="flex-1 border-b border-surface-outline"></div>
      <h1 className="uppercase font-semibold text-content-accent py-1 px-2 text-xs">{title}</h1>
      <div className="flex-1 border-b border-surface-outline"></div>
    </div>
  );
}

function StartDate({ form }) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="uppercase text-xs text-content-accent font-bold">Start Date</div>
      <div className="flex-1">
        <DateSelector
          date={form.startTime}
          onChange={form.setStartTime}
          minDate={null}
          maxDate={form.dueDate}
          testID={"project-start"}
        />
      </div>
    </div>
  );
}

function DueDate({ form }) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <div className="uppercase text-xs text-content-accent font-bold">Due Date</div>
      <div className="flex-1">
        <DateSelector
          date={form.dueDate}
          onChange={form.setDueDate}
          minDate={form.startTime}
          maxDate={null}
          testID={"project-due"}
        />
      </div>
    </div>
  );
}
