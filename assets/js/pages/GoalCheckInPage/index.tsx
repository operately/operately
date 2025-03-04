import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

interface LoaderResult {
  // TODO: Define what is loaded when you visit this page
}

export async function loader({}): Promise<LoaderResult> {
  return {}; // TODO: Load data here
}

export function Page() {
  // const data = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={"GoalCheckInPage"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">GoalCheckInPage</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
