import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

interface LoaderResult {}

export async function loader(): Promise<LoaderResult> {
  return {};
}

export function Page() {
  return (
    <Pages.Page title={"Hello Page"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">Hello Public Page</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
