import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Forms from "@/components/Form";

import { FormState } from "./useForm";
import { createTestId } from "@/utils/testid";

export function Form({ form }: { form: FormState }) {
  return (
    <>
      <Header />
      <TargetInputs form={form} />
      <Editor form={form} />
    </>
  );
}

function Header() {
  return <div className="text-3xl font-bold mb-8">Update Progress</div>;
}

function Editor({ form }: { form: FormState }) {
  const contentError = form.errors.find((e) => e.field === "content");

  return (
    <div className="mt-8">
      <div className="font-bold mb-2">Describe your progress and any learnings</div>
      {contentError && <div className="text-red-500 text-sm font-medium mt-1">Required</div>}
      <div className="border border-surface-outline rounded overflow-hidden">
        <TipTapEditor.StandardEditorForm editor={form.editor.editor} />
      </div>
    </div>
  );
}

function TargetInputs({ form }: { form: FormState }) {
  return (
    <div>
      <div className="font-bold mb-2">Success Conditions</div>

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
                  testId={createTestId("target", target.name)}
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
