import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useForm } from "./useForm";
import { useLoadedData } from "./loader";

export function Page() {
  const { group } = useLoadedData();
  const form = useForm(group);

  return (
    <Pages.Page title={"Edit " + group.name}>
      <Paper.Root>
        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">GroupEditPage</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
