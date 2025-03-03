import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

interface LoaderResult {
  // TODO: Define what is loaded when you visit this page
}

export async function loader({ params }): Promise<LoaderResult> {
  console.log("GoalCheckInNewPage loader", params);

  return {}; // TODO: Load data here
}

export function Page() {
  const data = Pages.useLoadedData<LoaderResult>();

  console.log("GoalCheckInNewPage page", data);

  // Placeholder for the page

  return (
    <Pages.Page title={"GoalCheckInNewPage"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">GoalCheckInNewPage</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
