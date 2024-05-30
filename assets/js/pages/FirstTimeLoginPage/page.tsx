import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";


export function Page() {
  // const data = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title="Welcome to Operately!">
      <Paper.Root>
        <Paper.Body>    
          <div className="text-content-accent text-2xl font-extrabold">Welcome to Operately!</div>
          <div className="text-content-accent">Let&apos;s set up your company.</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}