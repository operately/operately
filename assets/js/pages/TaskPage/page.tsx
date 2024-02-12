import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";

export function Page() {
  const { task } = useLoadedData();

  return (
    <Pages.Page title={[task.name]}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">{task.name}</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
