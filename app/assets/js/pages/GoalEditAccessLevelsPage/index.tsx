import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

import Api from "@/api";
import {
  applyAccessLevelConstraints,
  initialAccessLevels,
  UNRESTRICTED_PARENT_ACCESS,
} from "@/features/Permissions/AccessFields";
import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { assertPresent } from "@/utils/assertions";
import { Forms } from "turboui";

export default { name: "GoalEditAccessLevelsPage", loader, Page } as PageModule;

interface LoaderResult {
  goal: Goals.Goal;
}

async function loader({ params }): Promise<LoaderResult> {
  const goal = await Goals.getGoal({
    id: params.goalId,
    includeAccessLevels: true,
    includeSpace: true,
  }).then((data) => data.goal!);

  return { goal };
}

function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["Edit General Access", goal.name ?? "Goal"]}>
      <Paper.Root size="small">
        <Navigation />
        <Paper.Body>
          <h1 className="text-2xl font-extrabold">Edit General Access</h1>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const paths = usePaths();
  const { goal } = Pages.useLoadedData<LoaderResult>();

  const items: Paper.NavigationItem[] = [];

  if (goal.space) {
    items.push({ to: paths.spacePath(goal.space.id), label: goal.space.name });
    items.push({ to: paths.spaceWorkMapPath(goal.space.id), label: "Work Map" });
  } else {
    items.push({ to: paths.workMapPath("goals"), label: "Work Map" });
  }
  items.push({ to: paths.goalPath(goal.id), label: goal.name });
  items.push({ to: paths.goalAccessManagementPath(goal.id), label: "Team & Access" });

  return <Paper.Navigation items={items} />;
}

function Form() {
  const paths = usePaths();
  const { goal } = Pages.useLoadedData<LoaderResult>();

  assertPresent(goal.accessLevels, "Goal access levels must be present");

  const navigateBack = useNavigateTo(paths.goalAccessManagementPath(goal.id));
  const [edit] = Api.goals.useUpdateAccessLevels();
  const showSpaceAccess = Boolean(goal.space);

  const form = Forms.useForm({
    fields: {
      access: initialAccessLevels(goal.accessLevels, UNRESTRICTED_PARENT_ACCESS),
    },
    onChange: ({ newValues }) => {
      newValues.access = applyAccessLevelConstraints(newValues.access, UNRESTRICTED_PARENT_ACCESS);
    },
    submit: async () => {
      await edit({
        goalId: goal.id,
        accessLevels: {
          public: form.values.access.anonymous,
          company: form.values.access.companyMembers,
          space: form.values.access.spaceMembers,
        },
      });

      navigateBack();
    },
    cancel: navigateBack,
  });

  return (
    <Forms.Form form={form}>
      <Forms.AccessSelectors showSpaceAccess={showSpaceAccess} />
      <Forms.Submit />
    </Forms.Form>
  );
}
