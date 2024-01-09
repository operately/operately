import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";

export function Page() {
  const data = useLoadedData();

  return (
    <Pages.Page title={"PeoplePage"}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">PeoplePage</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
