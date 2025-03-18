import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";
import { EditBar } from "@/components/Pages/EditBar";

import { Messages } from "./Messages";
import { HorizontalRule, Title } from "./components";
import { Champion, Contributors, Reviewer } from "./contributors";
import { Timeframe } from "./Timeframe";
import { NextCheckIn } from "./NextCheckIn";
import { RelatedWork } from "./RelatedWork";
import { GoalName } from "./Name";
import { ParentGoal } from "./ParentGoal";
import { useForm } from "./useForm";
import { Description } from "./Description";
import { GoalTargetsField } from "@/features/goals/GoalTargetsV2";

export function Form() {
  const form = useForm();

  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <div className="grid grid-cols-[1fr_260px] gap-x-12">
        <ParentGoal />
        <div className="col-start-1 row-start-2 flex-1">
          <GoalName />
          <Description />
          <HorizontalRule />
          <Targets />
          <HorizontalRule />
          <Messages />
          <HorizontalRule />
          <RelatedWork />
        </div>
        <div className="col-start-2 row-start-2 flex flex-col gap-4 sticky top-0 self-start">
          <NextCheckIn />
          <Timeframe />
          <Champion />
          <Reviewer />
          <Contributors />
        </div>
      </div>

      <EditBar save={form.actions.submit} cancel={form.actions.cancel} />
    </Forms.Form>
  );
}

function Targets() {
  const isViewMode = useIsViewMode();

  return (
    <>
      <Title title="Targets" />
      <GoalTargetsField
        field="targets"
        readonly={isViewMode}
        editDefinition={true}
        editValue={false}
        hideBorder
        dotsBetween
      />
    </>
  );
}
