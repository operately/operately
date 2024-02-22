import React from "react";

import classNames from "classnames";

import * as People from "@/models/people";
import * as Icons from "@tabler/icons-react";
import * as Popover from "@radix-ui/react-popover";

import { FormState } from "./useForm";

export function StatusSection({ form }: { form: FormState }) {
  return (
    <div className="my-8">
      <div className="text-lg font-bold mx-auto">1. How's the project going?</div>

      <div className="flex flex-col gap-2 mt-2">
        <StatusDropdown form={form} />
      </div>
    </div>
  );
}

function StatusDropdown({ form }: { form: FormState }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (ref.current) setWidth(ref.current.clientWidth);
  }, [ref.current]);

  const triggerClassName = classNames(
    "flex justify-between items-center border border-surface-outline w-full rounded cursor-pointer",
  );
  const dropdownClassName = classNames(
    "border border-surface-outline mt-1 bg-surface z-[100] divide-y divide-stroke-base rounded shadow-lg overflow-hidden",
  );

  const handleSelected = (status: string) => () => {
    form.setStatus(status);
    setOpen(false);
  };

  const statusInTrigger = React.useMemo((): React.ReactNode => {
    if (form.status === "on_track") return <OnTrack form={form} />;
    if (form.status === "caution") return <Caution form={form} />;
    if (form.status === "issue") return <Issue form={form} />;

    throw new Error(`Unknown status: ${form.status}`);
  }, [form.status]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className={triggerClassName} ref={ref}>
          {statusInTrigger}

          <div className="p-4">
            <Icons.IconChevronDown size={24} />
          </div>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={dropdownClassName} align="start" style={{ width }}>
          <OnTrack form={form} selectable onSelected={handleSelected("on_track")} />
          <Caution form={form} selectable onSelected={handleSelected("caution")} />
          <Issue form={form} selectable onSelected={handleSelected("issue")} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function OnTrack({ form, ...props }: { form: FormState; selectable?: boolean; onSelected?: () => void }) {
  const reviewer = form.project.reviewer;
  const reviewerMention = reviewer ? People.firstName(reviewer) : "the reviewer";

  return (
    <StatusOption form={form} status="on_track" title="On Track" {...props}>
      Work is progressing as planned.
      <br />
      No involvement by {reviewerMention} is needed at this time.
    </StatusOption>
  );
}

function Caution({ form, ...props }: { form: FormState; selectable?: boolean; onSelected?: () => void }) {
  const reviewer = form.project.reviewer;
  const reviewerMention = reviewer ? People.firstName(reviewer) : "The reviewer";

  return (
    <StatusOption form={form} status="caution" title="Caution" {...props}>
      A potential problem may exist, perhaps in the future, if not monitored.
      <br />
      {reviewerMention} should be aware, but no action is needed.
    </StatusOption>
  );
}

function Issue({ form, ...props }: { form: FormState; selectable?: boolean; onSelected?: () => void }) {
  const reviewer = form.project.reviewer;
  const reviewerMention = reviewer ? People.firstName(reviewer) : "The reviewer";

  return (
    <StatusOption form={form} status="issue" title="Issue" {...props}>
      There’s a problem that may significantly affect time, cost, quality, or scope.
      <br />
      {reviewerMention}’s involvement is necessary.
    </StatusOption>
  );
}

function StatusOption({
  status,
  title,
  selectable,
  onSelected,
  children,
}: {
  form: FormState;
  status: string;
  title: string;
  selectable?: boolean;
  onSelected?: () => void;
  children: React.ReactNode;
}) {
  const color = status === "on_track" ? "green" : status === "caution" ? "yellow" : "red";

  const className = classNames("flex items-center gap-4 p-2", {
    "hover:bg-surface-highlight cursor-pointer": selectable,
  });

  return (
    <div className={className} onClick={onSelected}>
      <Circle color={color} />

      <div>
        <p className="font-bold">{title}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

const CIRCLE_BORDER_COLORS = {
  green: "border-green-600",
  yellow: "border-yellow-400",
  red: "border-red-500",
};

const CIRCLE_BACKGROUND_COLORS = {
  green: "bg-green-600",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
};

function Circle({ color }: { color: "green" | "yellow" | "red" }) {
  const borderColor = CIRCLE_BORDER_COLORS[color];
  const backgroundColor = CIRCLE_BACKGROUND_COLORS[color];

  const outerClassName = classNames(
    "w-10 h-10",
    "rounded-full",
    "flex items-center justify-center",
    "border-2",
    "p-0.5",
    borderColor,
  );
  const innerClassName = classNames("w-full h-full", "rounded-full", backgroundColor);

  return (
    <div className={outerClassName}>
      <div className={innerClassName}></div>
    </div>
  );
}
