import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Projects from "@/models/projects";

import { FilledButton } from "@/components/Button";
import { FormState } from "./useForm";
import { StatusSection } from "./StatusSection";
import { NotificationSection } from "./NotificationSection";

interface FormProps {
  form: FormState;
  noSubmitActions?: boolean;
  project: Projects.Project;
}

export function Form({ form, noSubmitActions }: FormProps) {
  return (
    <>
      <Header />
      <StatusSection form={form} />
      <TextForm form={form} />
      <NotificationSection form={form} />

      {noSubmitActions && <SubmitActions form={form} />}
    </>
  );
}

function Header() {
  return (
    <div>
      <div className="text-2xl font-bold mx-auto">Let's Check In</div>
    </div>
  );
}

function TextForm({ form }: { form: FormState }) {
  return (
    <>
      <div className="text-lg font-bold mx-auto">2. What's new since the last check-in?</div>
      <div className="mt-2 border border-surface-outline rounded">
        <TipTapEditor.StandardEditorForm editor={form.editor.editor} minHeight={100} />
      </div>
    </>
  );
}

function SubmitActions({ form }: { form: FormState }) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mt-4">
        <FilledButton onClick={form.submit} testId="post-check-in" bzzzOnClickFailure>
          {form.submitButtonLabel}
        </FilledButton>

        <FilledButton type="secondary" linkTo={form.cancelPath} data-test-id="cancel">
          Cancel
        </FilledButton>
      </div>
    </div>
  );
}
