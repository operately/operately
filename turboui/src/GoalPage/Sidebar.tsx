import { GoalPage } from ".";
import { Chronometer } from "../Chronometer";
import { IconQuestionMark } from "@tabler/icons-react";
import { Avatar, AvatarPerson } from "../Avatar";
import { SectionHeader } from "./SectionHeader";
import { SecondaryButton } from "../Button";
import { TimeframeSelectorDialog } from "../TimeframeSelectorDialog";
import { useState } from "react";
import { Timeframe } from "../utils/timeframes";
import { Trigger } from "@radix-ui/react-popover";
import { set } from "date-fns";

export function Sidebar(props: GoalPage.Props) {
  return (
    <div className="sm:col-span-3 space-y-6 hidden sm:block">
      <Timeline {...props} />

      <div className="space-y-3">
        <div className="font-bold">Team</div>

        <Champion {...props} />
        <Reviewer {...props} />
      </div>
    </div>
  );
}

function Timeline(props: GoalPage.Props) {
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

function Champion(props: GoalPage.Props) {
  if (!props.champion) {
    const message = props.canEdit ? "Assign a champion to get started" : "No champion assigned";

    return <MissingContributor role="No Champion" description={message} />;
  } else {
    return <Contributor person={props.champion} description="Champion" />;
  }
}

function Reviewer(props: GoalPage.Props) {
  if (!props.canEdit && !props.reviewer) return null;

  if (!props.reviewer) {
    return <MissingContributor role="No Reviewer" description="Assign a reviewer to get feedback" />;
  } else {
    return <Contributor person={props.reviewer} description="Reviewer" />;
  }
}

function MissingContributor({ role, description }: { role: string; description: string }) {
  return (
    <div className="flex items-start gap-2 truncate">
      <div className="bg-yellow-500/10 rounded-full h-[32px] w-[32px] flex items-center justify-center">
        <IconQuestionMark className="text-yellow-800" size={20} />
      </div>

      <div className="-mt-0.5 truncate">
        <div className="text-sm font-medium">{role}</div>
        <div className="text-xs truncate">{description}</div>
      </div>
    </div>
  );
}

function Contributor({ person, description }: { person: AvatarPerson; description: string }) {
  return (
    <div className="flex items-start gap-2 truncate">
      <Avatar person={person} size={32} />

      <div className="-mt-0.5 truncate">
        <div className="text-sm font-medium">{person.fullName}</div>
        <div className="text-xs truncate">{description}</div>
      </div>
    </div>
  );
}
