import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Forms from "@/components/Form";
import * as TipTapEditor from "@/components/Editor";

export function AccordionWithOptions({
  title,
  value,
  options,
  onChange,
  commentsEditor,
}: {
  title: string;
  value: string;
  options: Record<string, { label: string; explanation: string }>;
  onChange: (value: string) => void;
  commentsEditor?: ReturnType<typeof TipTapEditor.useEditor>;
}) {
  const current = options[value];

  return (
    <AccordionWithStatus title={title} status={current!.label}>
      <div className="p-4 bg-dark-3">
        <div className="uppercase text-xs mb-4">Choose</div>

        <Forms.RadioGroup name="status" defaultValue={value} onChange={onChange}>
          {Object.keys(options).map((key) => (
            <div className="mb-4" key={key}>
              <Forms.RadioWithExplanation
                value={key}
                label={options[key]!.label}
                explanation={options[key]!.explanation}
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
    </AccordionWithStatus>
  );
}

export function AccordionWithStatus({ title, status, children }) {
  const TitleWithStatus = ({ open }) => {
    return (
      <div className="flex items-center gap-2">
        <div className="text-white-1 font-bold">{title}</div>
        {!open && (
          <>
            <Icons.IconArrowRight size={16} className="text-white-2" />
            {status}
          </>
        )}
      </div>
    );
  };

  return <Accordion title={TitleWithStatus}>{children}</Accordion>;
}

export function Accordion({ title, children }) {
  const [open, setOpen] = React.useState<boolean>(false);
  const toggle = () => setOpen(!open);

  return (
    <div className="border border-dark-5 rounded bg-dark-4">
      <div className="flex items-center justify-between cursor-pointer py-2.5 px-2.5" onClick={toggle}>
        {isFunction(title) ? title({ open }) : title}

        <div>{open ? <Icons.IconChevronUp size={20} /> : <Icons.IconChevronDown size={20} />}</div>
      </div>

      {open && <div className="">{children}</div>}
    </div>
  );
}

function isFunction(object: any) {
  return typeof object === "function";
}
