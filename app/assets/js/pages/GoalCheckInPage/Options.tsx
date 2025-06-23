import * as React from "react";
import * as Pages from "@/components/Pages";
import * as PageOptions from "@/components/PaperContainer/PageOptions";

import { useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";
import { IconEdit } from "turboui";

export function Options() {
  const { update } = useLoadedData();

  const mode = Pages.usePageMode();
  const setPageMode = Pages.useSetPageMode();
  const me = useMe()!;

  const isEditVisible = compareIds(me.id, update.author?.id) && mode === "view";

  return (
    <PageOptions.Root testId="check-in-options">
      {isEditVisible && (
        <PageOptions.Action
          icon={IconEdit}
          title="Edit"
          onClick={() => setPageMode("edit")}
          testId="edit-check-in"
          keepOutsideOnBigScreen
        />
      )}
    </PageOptions.Root>
  );
}
