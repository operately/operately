import React from "react";

import * as Forms from "@/components/Form";
import * as TipTapEditor from "@/components/Editor";
import { Accordion } from "@/components/Accordion";

interface AccordionWithOptionsProps {
  name: string;
  title: string;
  value: string;
  options: any;
  onChange: (value: string) => void;
  commentsEditor: ReturnType<typeof TipTapEditor.useEditor>;
}

export function AccordionWithOptions(props: AccordionWithOptionsProps) {
  const current = props.options[props.value];

  return (
    <Accordion title={props.title} status={current!.label} testId={`${props.name}-accordion`}>
      <div className="p-4 bg-surface-dimmed border-t border-surface-outline">
        <div className="uppercase text-xs mb-4">Choose</div>
        <Options {...props} />

        <div className="uppercase text-xs mt-4 mb-4 tracking-wide">Leave comments</div>
        <Comments editor={props.commentsEditor} />
      </div>
    </Accordion>
  );
}

function Options(props: AccordionWithOptionsProps) {
  return (
    <Forms.RadioGroup name={props.name} defaultValue={props.value} onChange={props.onChange}>
      {Object.keys(props.options).map((key) => (
        <div className="mb-4" key={key}>
          <Forms.RadioWithExplanation
            value={key}
            label={props.options[key]!.label}
            explanation={props.options[key]!.explanation}
            data-test-id={`${props.name}-${key}`}
          />
        </div>
      ))}
    </Forms.RadioGroup>
  );
}

function Comments({ editor }: { editor: ReturnType<typeof TipTapEditor.useEditor> }) {
  return (
    <div className="bg-surface-dimmed border-x border-b border-stroke-base">
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={editor.editor} variant="large" />

        <div className="text-content-base relative" style={{ minHeight: "150px" }}>
          <TipTapEditor.EditorContent editor={editor.editor} />
          <TipTapEditor.LinkEditForm editor={editor.editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
