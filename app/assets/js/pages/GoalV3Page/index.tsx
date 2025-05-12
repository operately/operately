import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as React from "react";

interface LoaderResult {}

export async function loader({}): Promise<LoaderResult> {
  return {}; // TODO: Load data here
}

export function Page() {
  const data = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={"GoalV3Page"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">GoalV3Page</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
