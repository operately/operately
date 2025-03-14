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

export function Form() {
  const form = useForm();

  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <div className="flex gap-12">
        <div className="flex-1">
          <ParentGoal />
          <GoalName />
          <Description />
          <HorizontalRule />
          <Targets />
          <HorizontalRule />
          <Messages />
          <HorizontalRule />
          <RelatedWork />
        </div>

        <div className="w-[260px] flex flex-col gap-4 sticky top-0 self-start">
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
    <div>
      <Title title="Targets" />
      <Forms.FieldGroup>
        <Forms.GoalTargetsField readonly={isViewMode} field="targets" />
      </Forms.FieldGroup>
    </div>
  );
}
