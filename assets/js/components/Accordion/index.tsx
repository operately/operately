import * as React from "react";
import * as Icons from "@tabler/icons-react";
import classNames from "classnames";

interface AccordionProps {
  title: React.ReactNode | JSX.Element | string;
  children?: React.ReactNode;

  status?: JSX.Element | string;
  showStatusWhenOpen?: boolean;

  openable?: boolean;

  testId?: string;

  initialOpen?: boolean;
  nonOpenableMessage?: string;
}

export function Accordion(props: AccordionProps) {
  const [open, setOpen] = React.useState<boolean>(props.initialOpen || false);

  const toggle = () => {
    if (props.openable === false) return;

    setOpen(!open);
  };

  return (
    <div className="border border-surface-outline rounded bg-surface-accent" data-test-id={props.testId}>
      <div
        className={classNames({
          "flex items-center justify-between py-2.5 px-2.5 border-b border-stroke-base": true,
          "cursor-pointer": props.openable,
        })}
        onClick={toggle}
        data-test-id="open-close-toggle"
      >
        <div className="flex items-center gap-2">
          <div className="text-content-accent font-bold">{props.title}</div>

          <Status status={props.status} showStatusWhenOpen={props.showStatusWhenOpen} open={open} />
        </div>

        {props.openable ? (
          <div>{open ? <Icons.IconChevronUp size={20} /> : <Icons.IconChevronDown size={20} />}</div>
        ) : (
          <div className="text-content-dimmed text-xs">{props.nonOpenableMessage}</div>
        )}
      </div>

      {open && (
        <div className="rounded-b overflow-hidden" data-test-id={props.testId + "-content"}>
          {props.children}
        </div>
      )}
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
