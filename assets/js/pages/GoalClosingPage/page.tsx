import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Forms from "@/components/Form";
import * as Editor from "@/components/Editor";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import { createTestId } from "@/utils/testid";

export function Page() {
  const { goal } = useLoadedData();
  const form = useForm(goal);

  return (
    <Pages.Page title={"Closing " + goal.name}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/goals/${goal.id}`}>{goal.name}</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <PageTitle />
          <SuccessQuestion form={form} />
          <TargetInputs form={form} />
          <Retrospective form={form} />

          <div className="flex items-center gap-6 mt-8">
            <SubmitButton form={form} />
            <DimmedLink to={form.cancelPath}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageTitle() {
  return <div className="text-content-accent text-3xl font-extrabold">Close Goal</div>;
}

function Retrospective({ form }: { form: FormState }) {
  return (
    <div className="mt-6">
      <div className="font-bold mb-2">Retrospective notes:</div>

      <div className="border border-surface-outline rounded overflow-hidden">
        <Editor.StandardEditorForm editor={form.retrospectiveEditor.editor} />
      </div>
    </div>
  );
}

function SuccessQuestion({ form }: { form: FormState }) {
  return (
    <div className="mt-6">
      <div className="font-bold mb-2">Did you accomplish this goal?</div>

      <Forms.RadioGroup defaultValue="yes" onChange={form.setSuccess} name="success">
        {form.successOptions.map((option) => (
          <Forms.Radio
            key={option.value}
            label={option.label}
            value={option.value}
            disabled={false}
            testId={`success-${option.value}`}
          />
        ))}
      </Forms.RadioGroup>
    </div>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  return (
    <FilledButton onClick={form.submit} testId="confirm-close-goal">
      Close Goal
    </FilledButton>
  );
}

function TargetInputs({ form }: { form: FormState }) {
  return (
    <div className="mt-6">
      <div className="font-bold mb-2">Final Status of Success Conditions</div>
      <div className="flex flex-col gap-4">
        {form.targets.map((target, index) => {
          return (
            <div
              className="flex items-center justify-between bg-surface-dimmed border border-stroke-base p-3 rounded"
              key={index}
            >
              <div className="flex flex-col">
                <div className="font-semibold text-content-accent">{target.name}</div>
                <div className="text-content-dimmed text-sm">
                  Target: {target.to} {target.unit}
                </div>
              </div>

              <div className="">
                <Forms.TextInputNoLabel
                  id={target.id}
                  testId={createTestId("target", target.name, "value")}
                  value={target.value?.toString() || ""}
                  onChange={(value: string) => form.updateTarget(target.id, value === "" ? null : Number(value))}
                  error={!!form.errors.find((e) => e.field === target.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
