import { GoalPage } from ".";
import { Chronometer } from "../Chronometer";
import { SectionHeader } from "./SectionHeader";
import { SecondaryButton } from "../Button";
import { TimeframeSelectorDialog } from "../TimeframeSelectorDialog";
import { useState } from "react";
import { Timeframe } from "../utils/timeframes";
import { Trigger } from "@radix-ui/react-popover";

export function Timeline(props: GoalPage.Props) {
  const [open, setOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>(props.timeframe);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setTimeframe(timeframe);
    props.updateTimeframe(timeframe);
  };

  const edit = (
    <TimeframeSelectorDialog
      open={open}
      onOpenChange={setOpen}
      timeframe={timeframe}
      setTimeframe={handleTimeframeChange}
      alignContent="center"
      trigger={
        <Trigger>
          <SecondaryButton size="xxs" onClick={() => setOpen(true)}>
            Edit
          </SecondaryButton>
        </Trigger>
      }
    />
  );

  return (
    <div>
      <SectionHeader title="Timeline" buttons={edit} showButtons={props.canEdit} />
      <div className="mt-2">
        <Chronometer start={timeframe.startDate!} end={timeframe.endDate!} color="stone" />
      </div>
    </div>
  );
}
