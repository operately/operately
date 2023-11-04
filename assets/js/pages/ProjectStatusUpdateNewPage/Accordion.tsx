import React from "react";

import * as Forms from "@/components/Form";
import * as TipTapEditor from "@/components/Editor";
import { Accordion } from "@/components/Accordion";

export function AccordionWithOptions({
  name,
  title,
  value,
  options,
  onChange,
  commentsEditor,
}: {
  name: string;
  title: string;
  value: string;
  options: any;
  onChange: (value: string) => void;
  commentsEditor?: ReturnType<typeof TipTapEditor.useEditor>;
}) {
  const current = options[value];

  return (
    <Accordion title={title} status={current!.label} testId={`${name}-accordion`}>
      <div className="p-4 bg-dark-3">
        <div className="uppercase text-xs mb-4">Choose</div>

        <Forms.RadioGroup name={name} defaultValue={value} onChange={onChange}>
          {Object.keys(options).map((key) => (
            <div className="mb-4" key={key}>
              <Forms.RadioWithExplanation
                value={key}
                label={options[key]!.label}
                explanation={options[key]!.explanation}
                data-test-id={`${name}-${key}`}
              />
            </div>
          ))}
        </Forms.RadioGroup>

        {commentsEditor && (
          <>
            <div className="uppercase text-xs mt-4 mb-4 tracking-wide">Leave comments</div>

            <div className="bg-dark-3 border-x border-b border-dark-5">
              <TipTapEditor.Root>
                <TipTapEditor.Toolbar editor={commentsEditor.editor} variant="large" />

                <div className="text-white-1 relative" style={{ minHeight: "150px" }}>
                  <TipTapEditor.EditorContent editor={commentsEditor.editor} />
                  <TipTapEditor.LinkEditForm editor={commentsEditor.editor} />
                </div>
              </TipTapEditor.Root>
            </div>
          </>
        )}
      </div>
    </Accordion>
  );
}
