import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Forms from "@/components/Form";
import * as Editor from "@/components/Editor";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";

import { useLoadedData } from "./loader";
import { useForm, FormData } from "./useForm";

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

function Retrospective({ form }: { form: FormData }) {
  return <Editor.StandardEditorForm editor={form.retrospectiveEditor.editor} />;
}

function SuccessQuestion({ form }: { form: FormData }) {
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

function Retrspective({ form }: { form: FormData }) {}

function SubmitButton({ form }: { form: FormData }) {
  return (
    <FilledButton onClick={form.submit} testId="confirm-close-goal">
      Close Goal
    </FilledButton>
  );
}
