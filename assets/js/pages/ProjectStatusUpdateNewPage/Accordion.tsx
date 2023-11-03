import React from "react";

import classnames from "classnames";

import * as Icons from "@tabler/icons-react";
import * as Forms from "@/components/Form";

export function AccordionWithOptions({ title, value, options, onChange }) {
  const current = options[value];

  return (
    <AccordionWithStatus title={title} status={current.label}>
      <Forms.RadioGroup name="status" defaultValue={value} onChange={onChange}>
        {Object.keys(options).map((key) => (
          <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2" key={key}>
            <Forms.RadioWithExplanation value={key} label={options[key].label} explanation={options[key].explanation} />
          </div>
        ))}
      </Forms.RadioGroup>

      <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
        <span className="text-white-2">Add further details...</span>
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
    <div className={classnames({ "border border-dark-5 rounded": true, "border-dark-5 mb-8": open })}>
      <div className="flex items-center justify-between cursor-pointer py-3 px-2.5" onClick={toggle}>
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
