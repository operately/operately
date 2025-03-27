import { useEffect } from "react";

import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";

import Forms from "@/components/Forms";
import { useSetPageMode } from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";
import { validateTargets } from "@/features/goals/GoalTargetsV2/targetErrors";
import { applyAccessLevelConstraints, initialAccessLevels } from "@/features/Permissions/AccessFields";

import { parseTargets, serializeTimeframe } from "./utils";
import { useLoadedData, useRefresh } from "./loader";

export function useForm() {
  const refresh = useRefresh();
  const { goal, space } = useLoadedData();
  const [edit] = Goals.useEditGoal();
  const setPageMode = useSetPageMode();

  assertPresent(goal.targets, "targets must be present in goal");
  assertPresent(goal.timeframe, "timeframe must be present in goal");
  assertPresent(goal.champion, "champion must be present in goal");
  assertPresent(goal.reviewer, "reviewer must be present in goal");
  assertPresent(goal.accessLevels, "accessLevels must be present in goal");
  assertPresent(space.accessLevels, "accessLevels must be present in space");

  const currTimeframe = {
    startDate: Time.parseDate(goal.timeframe.startDate),
    endDate: Time.parseDate(goal.timeframe.endDate),
  };
  const parentAccessLevel = space.accessLevels;

  const form = Forms.useForm({
    fields: {
      name: goal.name!,
      status: goal.lastCheckIn?.status ?? "on_track",
      description: JSON.parse(goal.description!),
      targets: goal.targets,
      timeframe: currTimeframe,
      champion: goal.champion.id,
      reviewer: goal.reviewer.id,
      parentGoal: goal.parentGoal,
      access: initialAccessLevels(goal.accessLevels, parentAccessLevel),
    },
    cancel: () => setPageMode("view"),
    validate: (addError) => {
      validateTargets(form.values.targets, addError);
    },
    onChange: ({ field, newValues }) => {
      if (field === "access") {
        newValues.access = applyAccessLevelConstraints(newValues.access, parentAccessLevel);
      }
    },
    submit: async () => {
      assertPresent(goal.accessLevels, "accessLevels must be present in goal");

      const { updated, added } = parseTargets(form.values.targets);

      await edit({
        goalId: goal.id,
        parentGoalId: form.values.parentGoal?.id || null,
        name: form.values.name,
        championId: form.values.champion,
        reviewerId: form.values.reviewer,
        timeframe: serializeTimeframe(form.values.timeframe, currTimeframe),
        description: JSON.stringify(form.values.description),
        updatedTargets: updated,
        addedTargets: added,
        anonymousAccessLevel: form.values.access.anonymous,
        companyAccessLevel: form.values.access.companyMembers,
        spaceAccessLevel: form.values.access.spaceMembers,
      });

      refresh();
      setPageMode("view");
    },
  });

  useEffect(() => {
    form.actions.setValue("targets", goal.targets);
  }, [goal.targets]);

  return form;
}
