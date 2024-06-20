import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { FilledButton } from "@/components/Button";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";

import { DateSelector } from "./DateSelector";
import { MilestoneList } from "./MilestoneList";
import { unstable_usePrompt } from "react-router-dom";

export function Page() {
  const { project } = useLoadedData();
  const form = useForm(project);

  unstable_usePrompt({
    message: "You have unsaved changes. Are you sure you want to leave?",
    when: form.blockLeavingPage as any, // the type says that it can only be a boolean, but it can also be a function
  });

  return (
    <Pages.Page title={["Edit Project Timeline", project.name!]}>
      <Paper.Root size="medium">
        <Paper.Body minHeight="300px">
          <Header form={form} />
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form }: { form: FormState }) {
  return (
    <div className="">
      <Paper.Header className="bg-surface-dimmed">
        <div className="flex items-end justify-between my-2">
          <h1 className="text-xl font-extrabold">Editing the project timeline</h1>

          {form.milestoneBeingEdited ? null : (
            <div className="flex items-center gap-2">
              <FilledButton type="secondary" onClick={form.cancel} size="sm" testId="cancel-edit">
                Cancel
              </FilledButton>

              <FilledButton
                type="primary"
                onClick={form.submit}
                loading={form.submitting}
                size="sm"
                testId="save-changes"
                bzzzOnClickFailure
              >
                Save Changes
              </FilledButton>
            </div>
          )}
        </div>
      </Paper.Header>

      {form.errors.length > 0 && (
        <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}
    </div>
  );
}

function Form({ form }: { form: FormState }) {
  return (
    <div>
      <div className="flex items-start gap-4">
        <StartDate form={form} />
        <DueDate form={form} />
      </div>

      <Section title="Milestones" />
      <MilestoneList form={form} />
    </div>
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
