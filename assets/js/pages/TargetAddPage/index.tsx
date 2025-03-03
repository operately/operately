import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";

import Forms from "@/components/Forms";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeSpace: true,
      includeTargets: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includePermissions: true,
      includeUnreadNotifications: true,
      includeChampion: true,
      includeReviewer: true,
    }).then((data) => data.goal!),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  const form = Forms.useForm({
    fields: {
      type: "number",
    },
    submit: () => {},
  });

  return (
    <Pages.Page title={"TargetAddPage"}>
      <Paper.Root size="small">
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <div className="border-b border-stroke-base">
            <input
              type="text"
              placeholder="Target name..."
              className="w-full border-none ring-0 outline-none text-2xl text-content-base p-0 py-2 focus:ring-0 focus:bg-surface-highlight font-bold"
              autoFocus
            />
          </div>

          <div className="text-sm mt-2">
            Targets are measurable results, that, when completed, will also complete the Goal.
          </div>

          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <div className="font-bold mt-6 -mb-2">How do you want to measure this target?</div>
              <Forms.RadioButtons
                field="type"
                containerClass="flex items-center gap-4"
                options={[
                  { value: "number", label: "Number" },
                  { value: "percentage", label: "Percentage" },
                  { value: "currency", label: "Currency" },
                  { value: "checklist", label: "Checklist" },
                ]}
              />
            </Forms.FieldGroup>
          </Forms.Form>

          <div className="mt-6 flex items-center gap-3">
            <PrimaryButton size="sm">Save target</PrimaryButton>
            <SecondaryButton size="sm" linkTo={Paths.goalPath(goal.id!)}>
              Cancel
            </SecondaryButton>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
