import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";
import { EditBar } from "@/components/Pages/EditBar";
import { GoalTargetsField } from "@/features/goals/GoalTargetsV2";
import { GoalStatusBadge } from "@/features/goals/GoalStatusBadge";

import { Messages } from "./Messages";
import { HorizontalSpacer, Title } from "./components";
import { Champion, Contributors, Reviewer } from "./contributors";
import { Timeframe } from "./Timeframe";
import { NextCheckIn } from "./NextCheckIn";
import { RelatedWork } from "./RelatedWork";
import { GoalName } from "./Name";
import { ParentGoal } from "./ParentGoal";
import { useForm } from "./useForm";
import { Description } from "./Description";
import { Privacy } from "./Privacy";

export function Form() {
  const form = useForm();

  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <div className="grid grid-cols-[1fr_260px] gap-x-12">
        <ParentGoal />
        <div className="col-start-1 row-start-2 flex-1">
          <GoalName />
          <Description />
          <HorizontalSpacer />
          <Targets />
          <HorizontalSpacer />
          <Messages />
          <HorizontalSpacer />
          <RelatedWork />
        </div>
        <div className="col-start-2 row-start-2 flex flex-col gap-4 sticky top-0 self-start">
          <div className="flex">
            <GoalStatusBadge status={form.values.status} className="mt-3" />
          </div>
          <Timeframe />
          <Champion />
          <Reviewer />
          <Contributors />
          <NextCheckIn />
          <Privacy />
        </div>
      </div>

      <EditBar save={form.actions.submit} cancel={form.actions.cancel} />
    </Forms.Form>
  );
}

function Targets() {
  const isViewMode = useIsViewMode();

  return (
    <div>
      <Title title="Targets" />
      <GoalTargetsField field="targets" readonly={isViewMode} editDefinition={true} editValue={false} />
    </div>
  );
}
