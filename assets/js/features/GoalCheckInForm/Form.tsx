import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Forms from "@/components/Form";

import { FormState } from "./useForm";
import { createTestId } from "@/utils/testid";

export function Form({ form }: { form: FormState }) {
  return (
    <>
      <Header />
      <Editor form={form} />
    </>
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
  const contentError = form.errors.find((e) => e.field === "content");

  return (
    <div className="mt-4">
      <TipTapEditor.Root editor={form.editor.editor}>
        <TipTapEditor.Toolbar editor={form.editor.editor} />

        <div
          className="text-content-accent text-lg relative border-b border-stroke-base"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={form.editor.editor} />
        </div>
        {contentError && <div className="text-red-500 text-sm font-medium mt-1">Check-In message is required</div>}

        <p className="font-bold text-lg mt-8">Success Conditions</p>
        <p className="text-content-dimmed">What are the current values of your success conditions?</p>

        <TargetInputs form={form} />
      </TipTapEditor.Root>
    </div>
  );
}

function TargetInputs({ form }: { form: FormState }) {
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
              <div className="text-content-dimmed text-sm">
                Target: {target.to} {target.unit}
              </div>
            </div>

            <div className="">
              <Forms.TextInputNoLabel
                id={target.id}
                testId={createTestId("target", target.name)}
                value={target.value.toString()}
                onChange={(value: string) => form.updateTarget(target.id, Number(value))}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
