import React from "react";
import * as Time from "@/utils/time";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Goal, Target } from "@/models/goals";
import { Update } from "@/models/goalCheckIns";

import Forms from "@/components/Forms";
import { useSubscriptions } from "@/features/Subscriptions";
import { Spacer } from "@/components/Spacer";
import { useForm } from "./useForm";
import { assertPresent } from "@/utils/assertions";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import classNames from "classnames";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import AvatarList from "@/components/AvatarList";
import FormattedTime from "@/components/FormattedTime";
import { IconCheck } from "@tabler/icons-react";
import { match } from "ts-pattern";

export interface CreateProps {
  goal: Goal;
  mode: "create";
}
export interface EditProps {
  goal: Goal;
  update: Update;
  mode: "edit";
}

export function Form(props: CreateProps | EditProps) {
  const { goal } = props;

  assertPresent(goal.reviewer, "reviewer must be present in goal");

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers!, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const form = useForm(props, subscriptionsState);

  return (
    <Forms.Form form={form}>
      <Header />

      <Forms.FieldGroup>
        <div className="flex items-start gap-8 mt-6">
          <StatusPicker />
          <Timeframe goal={goal} />
        </div>

        <Targets />
        <Description goal={goal} />
      </Forms.FieldGroup>

      <Spacer size={4} />

      <div className="">
        <WhoToNotify subscriptionsState={subscriptionsState} />
        <div className="flex items-center gap-2 mt-8">
          <PrimaryButton>Post Update</PrimaryButton>
          <SecondaryButton>Cancel</SecondaryButton>
        </div>
      </div>
    </Forms.Form>
  );
}

function Header() {
  return (
    <div>
      <div className="text-3xl font-bold">Goal Check-in</div>
      <div className="">Share the progress with the team</div>
    </div>
  );
}

function Description({ goal }: { goal: Goal }) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <div className="mt-4">
      <div className="mb-2 font-bold">What's new since your last update?</div>

      <Forms.RichTextArea
        field="description"
        mentionSearchScope={mentionSearchScope}
        fontSize="text-base"
        placeholder="Describe your progress, risks, and blockers..."
      />
    </div>
  );
}

function Chronograph({ start, end }: { start: Date; end: Date }) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const diffToday = new Date().getTime() - new Date(start).getTime();
  const progress = (diffToday / diff) * 100;

  return (
    <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-xs rounded-lg px-2 py-2 flex items-center justify-between gap-1 relative overflow-hidden group cursor-pointer">
      <div className="absolute top-0 left-0 bottom-0 bg-indigo-500" style={{ width: progress + "%" }} />

      <span className="text-xs z-1 relative text-white-1 font-bold">
        <FormattedTime time={start} format="short-date" />
      </span>
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-2 inline-block" />
      <span className="mx-1 border-l border-surface-outline h-3 inline-block" />
      <span className="text-xs font-medium z-1 relative">
        <FormattedTime time={end} format="short-date" />
      </span>
    </div>
  );
}

function Targets() {
  return (
    <div className="mt-4">
      <div className="mb-1 font-bold">Update targets</div>

      <div className="grid grid-cols-1">
        <Target name="Figure out how to open a new office in Brazil" value={0} total={0} progress={0} index={1} />
        <Target name="Eliminate blockers for selling in China" value={4} total={20} progress={20} index={2} />
        <Target name="Achieve 1000+ active users in new countries" value={700} total={1000} progress={70} index={3} />
        <Target
          name="Increase revenue by 20% from international sales"
          value={"$ 1.2M"}
          total={"$ 1M"}
          progress={100}
          index={4}
        />
      </div>
    </div>
  );
}

function Target({ name, value, total, progress, index }) {
  return (
    <DivLink className="hover:bg-surface-highlight px-2 py-2 -mx-2" to={Paths.targetPath(index.toString())}>
      <div className="flex items-start justify-between">
        <div className="font-medium">{name}</div>
        <div className="tracking-wider text-sm font-medium">
          {value} / {total}
        </div>
      </div>

      <LargeProgress progress={progress} color="bg-accent-1" />
    </DivLink>
  );
}

function LargeProgress({ progress, color }) {
  const outer = classNames("h-1.5 bg-stroke-base mt-2");
  const inner = classNames("h-1.5", color);

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
    </div>
  );
}

function StatusPickerOption({ status, description, color, isSelected, onClick }) {
  return (
    <DropdownMenu.Item asChild>
      <div className="px-3 py-1.5 hover:bg-surface-highlight cursor-pointer rounded" onClick={onClick}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Circle size={20} color={color} />
            <div>
              <div className="text-sm font-bold leading-none">{status}</div>
              <div className="text-xs mt-1 leading-none">{description}</div>
            </div>
          </div>

          <div className={isSelected ? "opacity-100" : "opacity-0"}>
            <IconCheck />
          </div>
        </div>
      </div>
    </DropdownMenu.Item>
  );
}

function StatusTriggerValue({ status }) {
  return match(status)
    .with("not-set", () => (
      <div className="flex items-center gap-2">
        <Circle size={18} border="border-surface-outline" noFill borderSize={2} borderDashed />
        <div className="font-medium">Pick a status&hellip;</div>
      </div>
    ))
    .with("Pending", () => (
      <div className="flex items-center gap-2">
        <Circle size={18} color="bg-stone-500" />
        <div className="font-medium">Pending</div>
      </div>
    ))
    .with("On Track", () => (
      <div className="flex items-center gap-2">
        <Circle size={18} color="bg-accent-1" />
        <div className="font-medium">On Track</div>
      </div>
    ))
    .with("Concern", () => (
      <div className="flex items-center gap-2">
        <Circle size={18} color="bg-yellow-500" />
        <div className="font-medium">Concern</div>
      </div>
    ))
    .with("Off Track", () => (
      <div className="flex items-center gap-2">
        <Circle size={18} color="bg-red-500" />
        <div className="font-medium">Off Track</div>
      </div>
    ))
    .run();
}

function StatusPicker() {
  const [status, setStatus] = React.useState<string>("not-set");

  const trigger = (
    <div className="w-48">
      <div className="border border-stroke-base shadow-sm bg-surface-dimmed text-sm rounded-lg px-2 py-1.5 relative overflow-hidden group cursor-pointer">
        <StatusTriggerValue status={status} />
      </div>
    </div>
  );

  const content = (
    <div>
      <StatusPickerOption
        status="Pending"
        color="bg-stone-500"
        description="Work has not started yet."
        isSelected={status === "Pending"}
        onClick={() => setStatus("Pending")}
      />

      <StatusPickerOption
        status="On Track"
        color="bg-accent-1"
        description="Progressing well. No blockers."
        isSelected={status === "On Track"}
        onClick={() => setStatus("On Track")}
      />

      <StatusPickerOption
        status="Concern"
        color="bg-yellow-500"
        description="There are risks. Stefan should be aware."
        isSelected={status === "Concern"}
        onClick={() => setStatus("Concern")}
      />

      <StatusPickerOption
        status="Off Track"
        color="bg-red-500"
        description="There are blockers. Stefan's help is needed."
        isSelected={status === "Off Track"}
        onClick={() => setStatus("Off Track")}
      />
    </div>
  );

  return (
    <div>
      <div className="font-bold mb-2">Status</div>
      <OptionsMenu trigger={trigger} content={content} />
    </div>
  );
}

function Circle({
  size,
  color,
  border,
  noFill,
  borderSize,
  borderDashed,
}: {
  size: number;
  color?: string;
  border?: string;
  noFill?: boolean;
  borderSize?: number;
  borderDashed?: boolean;
}) {
  const className = classNames(
    "rounded-full",
    border ? "border" : "",
    border ? border : "",
    noFill ? "" : color,
    borderDashed ? "border-dashed" : "",
  );

  return (
    <div
      className={className}
      style={{ width: size + "px", height: size + "px", borderWidth: borderSize ? borderSize + "px" : undefined }}
    />
  );
}

const menuContentClass = classNames(
  "relative rounded-md mt-1 z-10 px-1 py-1.5",
  "shadow-xl ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown",
);

function OptionsMenu({ trigger, content }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} align="start">
          {content}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Timeframe({ goal }: { goal: Goal }) {
  const [start, _] = React.useState(Time.parse(goal.timeframe?.startDate!));
  const [end, setEnd] = React.useState(Time.parse(goal.timeframe?.endDate!));

  return (
    <div>
      <div className="mb-2 font-bold">Still on track for this deadline?</div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Chronograph start={start!} end={end!} />
        </div>

        <div className="flex items-center gap-2">
          <div
            className="text-xs bg-surface-dimmed px-2 py-1 rounded cursor-pointer"
            onClick={() => setEnd(new Date(+end! - 1000 * 60 * 60 * 24 * 30))}
          >
            -1 month
          </div>
          <div
            className="text-xs bg-surface-dimmed px-2 py-1 rounded cursor-pointer"
            onClick={() => setEnd(new Date(+end! + 1000 * 60 * 60 * 24 * 30))}
          >
            +1 month
          </div>
        </div>
      </div>
    </div>
  );
}

function WhoToNotify({ subscriptionsState }) {
  return (
    <div>
      <div className="font-bold mb-1">When I post this, notify:</div>

      <div className="flex items-center gap-2">
        <AvatarList
          people={subscriptionsState.subscribers.map((s: any) => s.person!)}
          size={30}
          stacked
          stackSpacing={"-space-x-1"}
        />
        <SecondaryButton size="xs">Add/Remove</SecondaryButton>
      </div>
    </div>
  );
}
