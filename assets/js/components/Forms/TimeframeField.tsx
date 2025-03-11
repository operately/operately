import React from "react";
import classNames from "classnames";
import * as Popover from "@radix-ui/react-popover";

import { Timeframe } from "@/utils/timeframes";

import { SecondaryButton } from "@/components/Buttons";
import { Chronometer } from "@/components/Chronometer";
import { CustomRangePicker } from "@/components/TimeframeSelector/CustomRangePicker";

import { useFieldValue } from "./FormContext";
import { Label } from "./Label";

interface Props {
  field: string;
  label?: string;
  readonly?: boolean;
  customLabel?: React.ReactNode;
}

//
// In Forms.useForm, the timeframe field should be of type: { startDate: Date; endDate: Date }
//
// For example:
//
// const form = Forms.useForm({
//   fields: {
//     timeframe: {
//        startDate: new Date(goal.timeframe.startDate),
//        endDate: new Date(goal.timeframe.endDate)
//     },
//   },
// });
//

export function TimeframeField({ field, label, readonly, customLabel }: Props) {
  const [open, setOpen] = React.useState(false);
  const [value] = useFieldValue<Timeframe>(field);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div>
        <div className="mb-[2px] flex items-center gap-2">
          {customLabel || <Label label={label} field={field} />}

          {!readonly && (
            <Popover.Trigger>
              <SecondaryButton size="xxs" spanButton>
                Edit
              </SecondaryButton>
            </Popover.Trigger>
          )}
        </div>
        <Chronometer start={value.startDate!} end={value.endDate!} />
      </div>

      <PopoverContent field={field} />
    </Popover.Root>
  );
}

function PopoverContent({ field }: { field: string }) {
  const [value, setValue] = useFieldValue<Timeframe>(field);

  const className = classNames(
    "z-[100] overflow-hidden",
    "border border-surface-outline",
    "rounded-lg shadow-xl",
    "bg-surface-base",
    "flex flex-col items-start p-6",
  );

  return (
    <Popover.Portal>
      <Popover.Content className={className} align="center" sideOffset={50}>
        <CustomRangePicker timeframe={value} setTimeframe={setValue} />
      </Popover.Content>
    </Popover.Portal>
  );
}
