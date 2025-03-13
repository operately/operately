import React from "react";

import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";

import Forms from "@/components/Forms";
import { useIsViewMode, useSetPageMode } from "@/components/Pages";
import { EditBar } from "@/components/Pages/EditBar";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { Messages } from "./Messages";
import { HorizontalRule, Title } from "./components";
import { findUpdatedTargets } from "./utils";
import { Champion, Contributors, Reviewer } from "./contributors";
import { Timeframe } from "./Timeframe";
import { NextCheckIn } from "./NextCheckIn";
import { RelatedWork } from "./RelatedWork";
import { Header } from "./Header";

export function Form() {
  const { goal } = useLoadedData();
  const [edit] = Goals.useEditGoal();
  const setPageMode = useSetPageMode();

  assertPresent(goal.targets, "targets must be present in goal");
  assertPresent(goal.timeframe, "timeframe must be present in goal");
  assertPresent(goal.champion, "champion must be present in goal");
  assertPresent(goal.reviewer, "reviewer must be present in goal");

  const currTimeframe = {
    startDate: Time.parseDate(goal.timeframe.startDate),
    endDate: Time.parseDate(goal.timeframe.endDate),
  };

  const form = Forms.useForm({
    fields: {
      name: goal.name!,
      description: JSON.parse(goal.description!),
      targets: goal.targets,
      timeframe: currTimeframe,
      champion: goal.champion.id,
      reviewer: goal.reviewer.id,
    },
    cancel: () => setPageMode("view"),
    submit: async () => {
      await edit({
        goalId: goal.id,
        name: form.values.name,
        description: JSON.stringify(form.values.description),
        updatedTargets: findUpdatedTargets(goal.targets!, form.values.targets),
      });

      setPageMode("view");
    },
  });

  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <div className="flex gap-12">
        <div className="flex-1">
          <Header />
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
      <Forms.RichTextArea
        field="description"
        placeholder="Write here..."
        mentionSearchScope={mentionSearchScope}
        readonly={isViewMode}
        height="3rem"
        hideBorder
        hideToolbar
      />
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
