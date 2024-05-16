import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId, includeParentGoal: true }),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={["New Discussion", goal.name]}>
      <Paper.Root>
        <Paper.Body>
          <Form form={form} />
        </Paper.Body>

        <div className="flex justify-center items-center mt-8">
          <FilledButton loading={form.submitting} testId="post-discussion" onClick={form.submit} size="lg">
            {form.submitButtonLabel}
          </FilledButton>
        </div>
      </Paper.Root>
    </Pages.Page>
  );
}
