import React from "react";

import * as Goals from "@/models/goals";

import Forms from "@/components/Forms";
import FormattedTime from "@/components/FormattedTime";
import { useIsViewMode, useSetPageMode } from "@/components/Pages";
import { PrimaryButton } from "@/components/Buttons";
import { EditBar } from "@/components/Pages/EditBar";
import { assertPresent } from "@/utils/assertions";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { Paths } from "@/routes/paths";

import { useLoadedData } from "./loader";
import { Messages } from "./Messages";
import { DisableInEditMode, HorizontalRule, Title } from "./components";

export function Form() {
  const { goal } = useLoadedData();
  const [edit] = Goals.useEditGoal();
  const setPageMode = useSetPageMode();

  assertPresent(goal.targets, "targets must be present in goal");

  const form = Forms.useForm({
    fields: {
      name: goal.name!,
      description: JSON.parse(goal.description!),
      targets: goal.targets,
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
        </div>

        <div className="w-[260px] sticky top-0 self-start">
          <Status />
        </div>
      </div>

      <EditBar save={form.actions.submit} cancel={form.actions.cancel} />
    </Forms.Form>
  );
}

function Header() {
  const isViewMode = useIsViewMode();

  return (
    <Forms.FieldGroup>
      <Forms.TitleInput field="name" readonly={isViewMode} />
    </Forms.FieldGroup>
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

function Status() {
  const { goal } = useLoadedData();
  const navigate = useNavigateTo(Paths.goalCheckInNewPath(goal.id!));

  assertPresent(goal.nextUpdateScheduledAt, "nextUpdateScheduledAt must be present in goal");

  return (
    <DisableInEditMode>
      <Title title="Next Check-in" />
      <div className="text-xs mb-2">
        Scheduled for <FormattedTime time={goal.nextUpdateScheduledAt} format="long-date" />
      </div>
      <div className="text-base">
        <PrimaryButton onClick={navigate} size="xs">
          Check-in Now
        </PrimaryButton>
      </div>
    </DisableInEditMode>
  );
}

function findUpdatedTargets(targets: Goals.Target[], updatedTargets: Goals.Target[]) {
  const originalTargets: Map<string, Goals.Target> = new Map();

  targets.forEach((target) => {
    originalTargets.set(target.id!, target);
  });

  const changedTargets = updatedTargets.filter((target) => {
    const originalTarget = originalTargets.get(target.id!);
    return target.value !== originalTarget?.value;
  });

  return changedTargets;
}
