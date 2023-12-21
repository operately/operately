import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as TipTapEditor from "@/components/Editor";
import * as Forms from "@/components/Form";

import { FilledButton } from "@/components/Button";
import { useLoadedData } from "./loader";
import { useForm } from "./useForm";

export function Page() {
  const { goal } = useLoadedData();
  const form = useForm();

  return (
    <Pages.Page title={["Check-In", goal.name]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          <Header />
          <Editor form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ goal }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/goals/${goal.id}`}>{goal.name}</Paper.NavItem>

      <Paper.NavSeparator />

      <Paper.NavItem linkTo={`/goals/${goal.id}/check-ins`}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
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

function Editor({ form }) {
  return (
    <div className="mt-4">
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={form.editor.editor} variant="large" />

        <div
          className="mb-8 text-content-accent text-lg relative border-b border-stroke-base"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={form.editor.editor} />
          <TipTapEditor.LinkEditForm editor={form.editor.editor} />
        </div>

        <p className="font-bold text-lg">Measurments</p>
        <p className="text-content-dimmed">Please adjust the values below.</p>

        <TargetInputs form={form} />
      </TipTapEditor.Root>
    </div>
  );
}

function TargetInputs({ form }) {
  return (
    <div className="my-4 flex flex-col gap-4">
      {form.targets.map((target, index) => {
        return (
          <div
            className="flex items-center justify-between bg-surface-dimmed border border-stroke-base p-3 rounded"
            key={index}
          >
            <div className="flex flex-col">
              <div className="font-semibold text-content-accent">{target.name}</div>
              <div className="text-content-dimmed">
                {target.from} → {target.to} {target.unit}
              </div>
            </div>

            <div className="">
              <Forms.TextInputNoLabel
                id={target.id}
                value={target.value}
                onChange={(value) => form.updateTarget(target.id, Number(value))}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubmitButton({ form }) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-center gap-4">
        <FilledButton
          type="primary"
          onClick={form.submit}
          loading={form.submitting}
          size="lg"
          testId="subit-check-in"
          bzzzOnClickFailure
        >
          Submit Check-In
        </FilledButton>
      </div>
    </div>
  );
}
