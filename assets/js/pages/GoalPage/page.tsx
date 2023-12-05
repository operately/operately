import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { Navigation } from "./Navigation";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="small">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">{goal.name}</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
