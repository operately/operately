import * as React from "react";
import * as Icons from "@tabler/icons-react";

interface AccordionProps {
  title: React.ReactNode | JSX.Element | string;
  children?: React.ReactNode;

  status?: JSX.Element | string;
  showStatusWhenOpen?: boolean;

  openable?: boolean;

  testId?: string;
}

export function Accordion(props: AccordionProps) {
  const [open, setOpen] = React.useState<boolean>(false);

  const toggle = () => {
    if (props.openable === false) return;

    setOpen(!open);
  };

  return (
    <div className="border border-surface-outline rounded bg-surface-accent" data-test-id={props.testId}>
      <div
        className="flex items-center justify-between cursor-pointer py-2.5 px-2.5"
        onClick={toggle}
        data-test-id="open-close-toggle"
      >
        <div className="flex items-center gap-2">
          <div className="text-content-accent font-bold">{props.title}</div>

          <Status status={props.status} showStatusWhenOpen={props.showStatusWhenOpen} open={open} />
        </div>

        {props.openable !== false && (
          <div>{open ? <Icons.IconChevronUp size={20} /> : <Icons.IconChevronDown size={20} />}</div>
        )}
      </div>

      {open && <div className="">{props.children}</div>}
    </div>
  );
}

function Status({ status, showStatusWhenOpen, open }) {
  if (!status) return null;
  if (open && !showStatusWhenOpen) return null;

  return (
    <>
      <Icons.IconArrowRight size={16} className="text-content-dimmed" />
      {status}
    </>
  );
}
