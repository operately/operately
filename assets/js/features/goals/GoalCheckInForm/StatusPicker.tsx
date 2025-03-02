import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import classNames from "classnames";
import { IconCheck } from "@tabler/icons-react";
import { match } from "ts-pattern";

export function StatusPicker() {
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
