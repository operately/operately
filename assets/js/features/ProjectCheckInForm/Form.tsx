import React from "react";

import * as TipTapEditor from "@/components/Editor";

import { FormState } from "./useForm";
import { HealthState } from "./useHealthState";
import { AccordionWithOptions } from "./Accordion";
import { options } from "./healthOptions";

import Button from "@/components/Button";

export function Form({ form, noSubmitActions }: { form: FormState; noSubmitActions?: boolean }) {
  return (
    <>
      <Header />
      <Editor form={form} />

      {noSubmitActions && <SubmitActions form={form} />}
    </>
  );
}

function SubmitActions({ form }: { form: FormState }) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={form.submit} variant="success" data-test-id="post-status-update" disabled={form.submitDisabled}>
        {form.submitButtonLabel}
      </Button>
      <Button variant="secondary" linkTo={form.cancelPath} data-test-id="cancel">
        Cancel
      </Button>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="uppercase text-content-accent tracking-wide w-full mb-1 text-sm font-semibold">CHECK-IN</div>
      <div className="text-4xl font-bold mx-auto">What's new since the last check-in?</div>
    </div>
  );
}

function Editor({ form }: { form: FormState }) {
  return (
    <div className="mt-4">
      <TipTapEditor.Root editor={form.editor.editor}>
        <TipTapEditor.Toolbar editor={form.editor.editor} />

        <div
          className="mb-8 text-content-accent text-lg relative border-b border-stroke-base"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={form.editor.editor} />
        </div>

        <Health state={form.healthState} />
      </TipTapEditor.Root>
    </div>
  );
}

function Health({ state }: { state: HealthState }) {
  return (
    <div>
      <p className="font-bold text-lg">Is there a change in the project's health?</p>
      <p className="text-content-dimmed">Please adjust the values below.</p>

      <div className="my-6 mb-10 flex flex-col gap-3">
        <AccordionWithOptions
          name="schedule"
          title="Schedule"
          value={state.schedule}
          options={options.schedule}
          onChange={state.setSchedule}
          commentsEditor={state.scheduleEditor}
        />
        <AccordionWithOptions
          name="budget"
          title="Budget"
          value={state.budget}
          options={options.budget}
          onChange={state.setBudget}
          commentsEditor={state.budgetEditor}
        />
        <AccordionWithOptions
          name="team"
          title="Team"
          value={state.team}
          options={options.team}
          onChange={state.setTeam}
          commentsEditor={state.teamEditor}
        />
        <AccordionWithOptions
          name="risks"
          title="Risks"
          value={state.risks}
          options={options.risks}
          onChange={state.setRisks}
          commentsEditor={state.risksEditor}
        />
        <AccordionWithOptions
          name="status"
          title="Overall Project Status"
          value={state.status}
          options={options.status}
          onChange={state.setStatus}
          commentsEditor={state.statusEditor}
        />
      </div>
    </div>
  );
}
