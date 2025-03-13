import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";
import { EditBar } from "@/components/Pages/EditBar";

import { useLoadedData } from "./loader";
import { Messages } from "./Messages";
import { HorizontalRule, Title } from "./components";
import { Champion, Contributors, Reviewer } from "./contributors";
import { Timeframe } from "./Timeframe";
import { NextCheckIn } from "./NextCheckIn";
import { RelatedWork } from "./RelatedWork";
import { GoalName } from "./Name";
import { ParentGoal } from "./ParentGoal";
import { useForm } from "./useForm";

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

function Description() {
  const { goal } = useLoadedData();
  const isViewMode = useIsViewMode();

  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <Forms.FieldGroup>
      <div className="-ml-2">
        <Forms.RichTextArea
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          readonly={isViewMode}
          height="3rem"
          hideBorder
          hideToolbar
        />
      </div>
    </Forms.FieldGroup>
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
