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

  const isZeroState = !props.timeframe.startDate || !props.timeframe.endDate;

  return (
    <div>
      <SectionHeader title="Timeline" buttons={edit} showButtons={props.canEdit} />

      {isZeroState ? (
        <ZeroState {...props} />
      ) : (
        <div className="mt-1">
          <Chronometer
            start={timeframe.startDate!}
            end={timeframe.endDate!}
            color="stone"
            showOverdueWarning={!props.closedOn}
          />
        </div>
      )}
    </div>
  );
}

function ZeroState(props: GoalPage.Props) {
  if (props.canEdit) {
    return (
      <div className="mt-1">
        <div className="text-content-dimmed text-sm">Set the timeline to track progress and stay on target.</div>
      </div>
    );
  } else {
    return (
      <div className="mt-1">
        <div className="text-content-dimmed text-sm">The champion didn't yet set a timeline for this goal.</div>
      </div>
    );
  }
}
