import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

interface LoaderResult {
  // TODO: Define what is loaded when you visit this page
}

export async function loader({ params }): Promise<LoaderResult> {
  return {}; // TODO: Load data here
}

export function Page() {
  const data = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={"TargetAddPage"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">TargetAddPage</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
